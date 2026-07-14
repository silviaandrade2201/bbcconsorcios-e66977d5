import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.enum(["admin", "consultor", "cliente"]);

const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
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
  password: z.string().min(6),
  name: z.string().min(2),
  cpf: z.string().min(11),
  phone: z.string().min(8),
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
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", role)
    .maybeSingle();
  return !!data;
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await checkRole(context, "admin"))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*, user_roles(role)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userCreateSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await checkRole(context, "admin"))) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: auth, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (authError || !auth.user) throw authError ?? new Error("User creation failed");

    const { error: profileError } = await context.supabase.from("profiles").insert({
      user_id: auth.user.id,
      email: data.email,
      name: data.name,
      cpf: data.cpf,
      phone: data.phone,
      whatsapp: data.whatsapp,
    });
    if (profileError) throw profileError;

    const { error: roleError } = await context.supabase.from("user_roles").insert({
      user_id: auth.user.id,
      role: data.role,
    });
    if (roleError) throw roleError;

    return { userId: auth.user.id };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!(await checkRole(context, "admin"))) throw new Error("Forbidden");

    const { userId, role, ...profileData } = data;
    const { error: profileError } = await context.supabase
      .from("profiles")
      .update(profileData)
      .eq("user_id", userId);
    if (profileError) throw profileError;

    if (role) {
      const { error: roleError } = await context.supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      if (roleError) throw roleError;
    }
    return { ok: true };
  });

export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const isAdmin = await checkRole(context, "admin");
    const isConsultor = await checkRole(context, "consultor");
    if (!isAdmin && !isConsultor) throw new Error("Forbidden");

    let query = context.supabase.from("profiles").select("*, consultor:consultor_id(name), user_roles(role)");
    if (!isAdmin) {
      const { data: me } = await context.supabase
        .from("profiles")
        .select("id")
        .eq("user_id", context.userId)
        .maybeSingle();
      if (me?.id) query = query.eq("consultor_id", me.id);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => clientSchema.parse(input))
  .handler(async ({ data, context }) => {
    const isAdmin = await checkRole(context, "admin");
    const isConsultor = await checkRole(context, "consultor");
    if (!isAdmin && !isConsultor) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: auth, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (authError || !auth.user) throw authError ?? new Error("Client creation failed");

    let consultorId = data.consultorId;
    if (!isAdmin && !consultorId) {
      const { data: me } = await context.supabase
        .from("profiles")
        .select("id")
        .eq("user_id", context.userId)
        .maybeSingle();
      consultorId = me?.id;
    }

    const { error: profileError } = await context.supabase.from("profiles").insert({
      user_id: auth.user.id,
      email: data.email,
      name: data.name,
      cpf: data.cpf,
      phone: data.phone,
      whatsapp: data.whatsapp,
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

    return { userId: auth.user.id };
  });

export const updateClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => clientUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, consultorId, ...rest } = data;
    const updatePayload = consultorId ? { ...rest, consultor_id: consultorId } : rest;
    const { error } = await context.supabase.from("profiles").update(updatePayload).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!profile) throw new Error("Client not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);
    if (error) throw error;
    return { ok: true };
  });

export const listConsultores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await checkRole(context, "admin"))) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, name, user_roles(role)")
      .eq("user_roles.role", "consultor");
    if (error) throw error;
    return data ?? [];
  });
