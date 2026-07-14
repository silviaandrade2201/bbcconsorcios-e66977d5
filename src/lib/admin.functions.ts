import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidCpf, sanitizeCpf } from "./cpf";

const roleSchema = z.enum(["admin", "consultor", "cliente"]);

const userCreateSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Informe o nome"),
  role: roleSchema,
  cpf: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

const userUpdateSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  status: z.enum(["ativo", "inativo", "pendente"]).optional(),
  role: roleSchema.optional(),
});

const clientSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Informe o nome"),
  cpf: z.string().min(11, "CPF inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(["ativo", "inativo", "pendente"]).default("ativo"),
  notes: z.string().optional(),
  consultorId: z.string().uuid().optional(),
});

const clientUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  cpf: z.string().min(11).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  status: z.enum(["ativo", "inativo", "pendente"]).optional(),
  notes: z.string().optional(),
  consultorId: z.string().uuid().optional(),
});

async function checkRole(ctx: { userId: string; supabase: any }, role: "admin" | "consultor") {
  // Usa service-role para evitar qualquer bloqueio de RLS na verificação de permissão.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", role)
    .maybeSingle();
  if (error) {
    console.error("[checkRole] erro:", error, "userId:", ctx.userId, "role:", role);
    return false;
  }
  return !!data;
}

/** Verifica se CPF já existe (em qualquer profile, exceto opcionalmente um id). */
async function cpfExists(supabase: any, cpf: string, exceptProfileId?: string) {
  let q = supabase.from("profiles").select("id").eq("cpf", cpf).limit(1);
  if (exceptProfileId) q = q.neq("id", exceptProfileId);
  const { data } = await q.maybeSingle();
  return !!data;
}

async function emailExistsInProfiles(supabase: any, email: string, exceptUserId?: string) {
  let q = supabase.from("profiles").select("id").ilike("email", email).limit(1);
  if (exceptUserId) q = q.neq("user_id", exceptUserId);
  const { data } = await q.maybeSingle();
  return !!data;
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await checkRole(context, "admin"))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles, error }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    if (error) throw error;
    const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
    return (profiles ?? [])
      .map((p: any) => ({ ...p, role: roleMap.get(p.user_id), user_roles: { role: roleMap.get(p.user_id) } }))
      .filter((u: any) => u.role === "admin" || u.role === "consultor");
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userCreateSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await checkRole(context, "admin"))) throw new Error("Permissão insuficiente.");

    if (await emailExistsInProfiles(context.supabase, data.email))
      throw new Error("E-mail já cadastrado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: auth, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (authError || !auth.user) {
      const msg = authError?.message || "";
      if (/registered|exists/i.test(msg)) throw new Error("E-mail já cadastrado.");
      throw authError ?? new Error("Falha ao criar usuário.");
    }

    // Transactional-ish: rollback em qualquer falha subsequente.
    try {
      const cpfDigits = sanitizeCpf(data.cpf);
      const { error: profileError } = await context.supabase.from("profiles").insert({
        user_id: auth.user.id,
        email: data.email,
        name: data.name,
        cpf: cpfDigits || null,
        phone: data.phone,
        whatsapp: data.whatsapp,
      });
      if (profileError) throw profileError;

      const { error: roleError } = await context.supabase.from("user_roles").insert({
        user_id: auth.user.id,
        role: data.role,
      });
      if (roleError) throw roleError;
    } catch (e) {
      await supabaseAdmin.auth.admin.deleteUser(auth.user.id).catch(() => {});
      throw e;
    }

    return { userId: auth.user.id };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await checkRole(context, "admin"))) throw new Error("Permissão insuficiente.");

    const { userId, role, ...profileData } = data;
    const { error: profileError } = await context.supabase
      .from("profiles")
      .update(profileData)
      .eq("user_id", userId);
    if (profileError) throw profileError;

    if (role) {
      // upsert-like: apaga e insere
      await context.supabase.from("user_roles").delete().eq("user_id", userId);
      const { error: roleError } = await context.supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (roleError) throw roleError;
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await checkRole(context, "admin"))) throw new Error("Permissão insuficiente.");
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const isAdmin = await checkRole(context, "admin");
    const isConsultor = await checkRole(context, "consultor");
    if (!isAdmin && !isConsultor) throw new Error("Permissão insuficiente.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("profiles").select("*");

    if (!isAdmin) {
      const { data: me } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", context.userId)
        .maybeSingle();
      if (me?.id) query = query.eq("consultor_id", me.id);
    }
    const { data: profiles, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    const [{ data: roles }, { data: consultores }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("profiles").select("id, name"),
    ]);
    const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
    const consMap = new Map((consultores ?? []).map((c: any) => [c.id, c.name]));

    return (profiles ?? [])
      .filter((p: any) => roleMap.get(p.user_id) === "cliente")
      .map((p: any) => ({
        ...p,
        role: "cliente",
        consultor: p.consultor_id ? { name: consMap.get(p.consultor_id) } : null,
      }));
  });

export const createClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => clientSchema.parse(input))
  .handler(async ({ data, context }) => {
    const isAdmin = await checkRole(context, "admin");
    const isConsultor = await checkRole(context, "consultor");
    if (!isAdmin && !isConsultor) throw new Error("Permissão insuficiente.");

    const cpfDigits = sanitizeCpf(data.cpf);
    if (!isValidCpf(cpfDigits)) throw new Error("CPF inválido.");
    if (await cpfExists(context.supabase, cpfDigits)) throw new Error("CPF já cadastrado.");

    const email = data.email ?? `cliente-${cpfDigits}@clientes.bbc.local`;
    if (await emailExistsInProfiles(context.supabase, email))
      throw new Error("E-mail já cadastrado.");

    let consultorId = data.consultorId;
    if (!isAdmin && !consultorId) {
      const { data: me } = await context.supabase
        .from("profiles")
        .select("id")
        .eq("user_id", context.userId)
        .maybeSingle();
      consultorId = me?.id;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: auth, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { cpf: cpfDigits, name: data.name },
    });
    if (authError || !auth.user) {
      const msg = authError?.message || "";
      if (/registered|exists/i.test(msg)) throw new Error("CPF já cadastrado.");
      throw authError ?? new Error("Falha ao criar cliente.");
    }

    try {
      const { error: profileError } = await context.supabase.from("profiles").insert({
        user_id: auth.user.id,
        email,
        name: data.name,
        cpf: cpfDigits,
        phone: data.phone?.replace(/\D/g, ""),
        whatsapp: (data.whatsapp ?? data.phone)?.replace(/\D/g, ""),
        address: data.address,
        city: data.city,
        state: data.state,
        status: data.status,
        notes: data.notes,
        consultor_id: consultorId,
      });
      if (profileError) throw profileError;

      const { error: roleError } = await context.supabase.from("user_roles").insert({
        user_id: auth.user.id,
        role: "cliente",
      });
      if (roleError) throw roleError;
    } catch (e) {
      await supabaseAdmin.auth.admin.deleteUser(auth.user.id).catch(() => {});
      throw e;
    }

    return { userId: auth.user.id };
  });

export const updateClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => clientUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, consultorId, cpf, phone, whatsapp, ...rest } = data;

    if (cpf) {
      const cpfDigits = sanitizeCpf(cpf);
      if (!isValidCpf(cpfDigits)) throw new Error("CPF inválido.");
      if (await cpfExists(context.supabase, cpfDigits, id))
        throw new Error("CPF já cadastrado.");
      (rest as any).cpf = cpfDigits;
    }
    if (phone !== undefined) (rest as any).phone = phone.replace(/\D/g, "");
    if (whatsapp !== undefined) (rest as any).whatsapp = whatsapp.replace(/\D/g, "");
    if (consultorId) (rest as any).consultor_id = consultorId;

    const { error } = await context.supabase.from("profiles").update(rest).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const isAdmin = await checkRole(context, "admin");
    const isConsultor = await checkRole(context, "consultor");
    if (!isAdmin && !isConsultor) throw new Error("Permissão insuficiente.");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!profile) throw new Error("Registro não localizado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);
    if (error) throw error;
    return { ok: true };
  });

export const listConsultores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await checkRole(context, "admin"))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "consultor");
    const ids = (roles ?? []).map((r: any) => r.user_id);
    if (!ids.length) return [];
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, name")
      .in("user_id", ids);
    if (error) throw error;
    return data ?? [];
  });

/** Estatísticas em tempo real para o dashboard. */
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const isAdmin = await checkRole(context, "admin");
    const isConsultor = await checkRole(context, "consultor");
    if (!isAdmin && !isConsultor) throw new Error("Permissão insuficiente.");

    // Carrega tudo em paralelo com counts do PostgREST.
    const [clientesQ, consultoresQ, cartasDispQ, cartasVendQ, recentesQ] = await Promise.all([
      context.supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "cliente"),
      context.supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "consultor"),
      context.supabase
        .from("cartas")
        .select("*", { count: "exact", head: true })
        .eq("situacao", "disponivel"),
      context.supabase
        .from("cartas")
        .select("*", { count: "exact", head: true })
        .eq("situacao", "vendida"),
      context.supabase
        .from("profiles")
        .select("id, name, created_at, user_roles(role)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      clientes: clientesQ.count ?? 0,
      consultores: consultoresQ.count ?? 0,
      cartasDisponiveis: cartasDispQ.count ?? 0,
      cartasVendidas: cartasVendQ.count ?? 0,
      recentes: (recentesQ.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        role: r.user_roles?.role,
        createdAt: r.created_at,
      })),
    };
  });
