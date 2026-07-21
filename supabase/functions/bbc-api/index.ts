// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ok = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
const bad = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });

// ---------- CPF helpers ----------
const sanitizeCpf = (v: string) => (v || "").replace(/\D/g, "");
function isValidCpf(v: string) {
  const cpf = sanitizeCpf(v);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const d = cpf.split("").map(Number);
  const calc = (base: number[]) => {
    let s = 0;
    for (let i = 0; i < base.length; i++) s += base[i] * (base.length + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(d.slice(0, 9)) === d[9] && calc(d.slice(0, 10)) === d[10];
}

// ---------- Numeric helpers ----------
const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number) => String(n).padStart(2, "0");
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function addMonthsKeepDay(base: Date, months: number, dia: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth() + months, 1, 12, 0, 0);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dia, last));
  return d;
}
function calcularCarta(input: {
  valor_bem: number;
  parcelas_totais: number;
  percentual_administrativo: number;
}) {
  const valor_bem = round2(input.valor_bem);
  const perc = input.percentual_administrativo;
  const valor_administrativo = round2((valor_bem * perc) / 100);
  const valor_total = round2(valor_bem + valor_administrativo);
  const base = Math.floor((valor_total * 100) / input.parcelas_totais) / 100;
  const parcelas: number[] = new Array(input.parcelas_totais).fill(base);
  const soma = round2(base * input.parcelas_totais);
  const dif = round2(valor_total - soma);
  parcelas[parcelas.length - 1] = round2(parcelas[parcelas.length - 1] + dif);
  return { valor_bem, valor_administrativo, valor_total, parcelas };
}
function calcularPrimeiroVencimento(data_adesao: string): string {
  const d = new Date(data_adesao + "T12:00:00");
  const dia = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth(), 10, 12, 0, 0);
  if (dia >= 10) target.setMonth(target.getMonth() + 1);
  return toISODate(target);
}
function paymentDateFromVencimento(vencimento: string): string {
  const h = 8 + Math.floor(Math.random() * 12);
  const m = Math.floor(Math.random() * 60);
  const s = Math.floor(Math.random() * 60);
  return new Date(`${vencimento}T${pad(h)}:${pad(m)}:${pad(s)}`).toISOString();
}

// ---------- Serve ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad(400, "Corpo inválido.");
  }
  const action: string = body?.action;
  const data: any = body?.data ?? {};
  if (!action) return bad(400, "Ação não informada.");

  try {
    // ---------- PUBLIC ----------
    if (action === "resolveClienteLogin") {
      const cpf = sanitizeCpf(data.cpf || "");
      if (!isValidCpf(cpf)) return bad(400, "CPF inválido.");
      const { data: profile } = await admin
        .from("profiles")
        .select("email, user_id, status")
        .eq("cpf", cpf)
        .maybeSingle();
      if (!profile?.email || !profile.user_id)
        return bad(404, "Usuário não encontrado.");
      if (profile.status === "inativo")
        return bad(403, "Cadastro inativo. Fale com seu consultor.");
      const { data: role } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.user_id)
        .maybeSingle();
      if (role?.role !== "cliente")
        return bad(403, "Este acesso é exclusivo para clientes.");
      return ok({ email: profile.email });
    }

    // ---------- AUTH ----------
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return bad(401, "Autenticação obrigatória.");
    const { data: u, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !u?.user) return bad(401, "Sessão inválida.");
    const userId = u.user.id;

    const hasRole = async (role: "admin" | "consultor") => {
      const { data } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", role)
        .maybeSingle();
      return !!data;
    };
    const isAdmin = () => hasRole("admin");
    const isConsultor = () => hasRole("consultor");
    const isStaff = async () =>
      (await isAdmin()) || (await isConsultor());

    const cpfExists = async (cpf: string, exceptProfileId?: string) => {
      let q = admin.from("profiles").select("id").eq("cpf", cpf).limit(1);
      if (exceptProfileId) q = q.neq("id", exceptProfileId);
      const { data } = await q.maybeSingle();
      return !!data;
    };
    const emailExists = async (email: string, exceptUserId?: string) => {
      let q = admin.from("profiles").select("id").ilike("email", email).limit(1);
      if (exceptUserId) q = q.neq("user_id", exceptUserId);
      const { data } = await q.maybeSingle();
      return !!data;
    };

    async function logHistory(
      carta_id: string,
      event_type: string,
      d: any,
      created_at?: string | null,
    ) {
      const row: any = {
        carta_id,
        event_type,
        installment_number: d.installment_number ?? null,
        due_date: d.due_date ?? null,
        amount: d.amount ?? null,
        status: d.status ?? null,
        payment_date: d.payment_date ?? null,
        notes: d.notes ?? null,
        created_by: userId,
        updated_by: userId,
      };
      if (created_at) row.created_at = created_at;
      await admin.from("payment_history").insert(row);
    }

    async function refreshAtraso(carta_id: string) {
      const today = toISODate(new Date());
      await admin
        .from("carta_parcelas")
        .update({ status: "atraso" })
        .eq("carta_id", carta_id)
        .neq("status", "pago")
        .lt("vencimento", today);
      await admin
        .from("carta_parcelas")
        .update({ status: "pendente" })
        .eq("carta_id", carta_id)
        .eq("status", "atraso")
        .gte("vencimento", today);
    }

    switch (action) {
      // =============== USERS ===============
      case "listUsers": {
        if (!(await isAdmin())) return bad(403, "Permissão insuficiente.");
        const [{ data: profiles, error }, { data: roles }] = await Promise.all([
          admin.from("profiles").select("*").order("created_at", { ascending: false }),
          admin.from("user_roles").select("user_id, role"),
        ]);
        if (error) throw error;
        const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
        return ok(
          (profiles ?? [])
            .map((p: any) => ({
              ...p,
              role: roleMap.get(p.user_id),
              user_roles: { role: roleMap.get(p.user_id) },
            }))
            .filter((u: any) => u.role === "admin" || u.role === "consultor"),
        );
      }

      case "createUser": {
        if (!(await isAdmin())) return bad(403, "Permissão insuficiente.");
        if (await emailExists(data.email))
          return bad(409, "E-mail já cadastrado.");
        const { data: authRes, error: authError } = await admin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
        });
        if (authError || !authRes.user) {
          const msg = authError?.message || "";
          if (/registered|exists/i.test(msg)) return bad(409, "E-mail já cadastrado.");
          return bad(400, msg || "Falha ao criar usuário.");
        }
        try {
          const cpfDigits = sanitizeCpf(data.cpf || "");
          const { error: pErr } = await admin.from("profiles").insert({
            user_id: authRes.user.id,
            email: data.email,
            name: data.name,
            cpf: cpfDigits || null,
            phone: data.phone,
            whatsapp: data.whatsapp,
          });
          if (pErr) throw pErr;
          const { error: rErr } = await admin.from("user_roles").insert({
            user_id: authRes.user.id,
            role: data.role,
          });
          if (rErr) throw rErr;
        } catch (e: any) {
          await admin.auth.admin.deleteUser(authRes.user.id).catch(() => {});
          return bad(400, e?.message || "Falha ao criar usuário.");
        }
        return ok({ userId: authRes.user.id });
      }

      case "updateUser": {
        if (!(await isAdmin())) return bad(403, "Permissão insuficiente.");
        const { userId: uid, role, ...profileData } = data;
        const { error: pErr } = await admin
          .from("profiles").update(profileData).eq("user_id", uid);
        if (pErr) throw pErr;
        if (role) {
          await admin.from("user_roles").delete().eq("user_id", uid);
          const { error: rErr } = await admin
            .from("user_roles").insert({ user_id: uid, role });
          if (rErr) throw rErr;
        }
        return ok({ ok: true });
      }

      case "deleteUser": {
        if (!(await isAdmin())) return bad(403, "Permissão insuficiente.");
        if (data.userId === userId)
          return bad(400, "Você não pode excluir a própria conta.");
        const { error } = await admin.auth.admin.deleteUser(data.userId);
        if (error) throw error;
        return ok({ ok: true });
      }

      // =============== CLIENTS ===============
      case "listClients": {
        const admF = await isAdmin();
        const conF = await isConsultor();
        if (!admF && !conF) return bad(403, "Permissão insuficiente.");
        let query = admin.from("profiles").select("*");
        if (!admF) query = query.eq("consultor_user_id", userId);
        const { data: profiles, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        const [{ data: roles }, { data: consultores }] = await Promise.all([
          admin.from("user_roles").select("user_id, role"),
          admin.from("profiles").select("id, name"),
        ]);
        const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
        const consMap = new Map((consultores ?? []).map((c: any) => [c.id, c.name]));
        return ok(
          (profiles ?? [])
            .filter((p: any) => roleMap.get(p.user_id) === "cliente")
            .map((p: any) => ({
              ...p,
              role: "cliente",
              consultor: p.consultor_id ? { name: consMap.get(p.consultor_id) } : null,
            })),
        );
      }

      case "createClient": {
        const admF = await isAdmin();
        const conF = await isConsultor();
        if (!admF && !conF) return bad(403, "Permissão insuficiente.");
        const cpfDigits = sanitizeCpf(data.cpf);
        if (!isValidCpf(cpfDigits)) return bad(400, "CPF inválido.");
        if (await cpfExists(cpfDigits)) return bad(409, "CPF já cadastrado.");
        const email = data.email ?? `cliente-${cpfDigits}@clientes.bbc.local`;
        if (await emailExists(email)) return bad(409, "E-mail já cadastrado.");

        let consultorId = data.consultorId;
        let consultorUserId: string | undefined;
        if (!admF && !consultorId) {
          const { data: me } = await admin
            .from("profiles").select("id").eq("user_id", userId).maybeSingle();
          consultorId = me?.id;
          consultorUserId = userId;
        } else if (consultorId) {
          const { data: cons } = await admin
            .from("profiles").select("user_id").eq("id", consultorId).maybeSingle();
          consultorUserId = cons?.user_id;
        }

        const { data: authRes, error: authError } = await admin.auth.admin.createUser({
          email,
          password: data.password,
          email_confirm: true,
          user_metadata: { cpf: cpfDigits, name: data.name },
        });
        if (authError || !authRes.user) {
          const msg = authError?.message || "";
          if (/registered|exists/i.test(msg)) return bad(409, "CPF já cadastrado.");
          return bad(400, msg || "Falha ao criar cliente.");
        }
        try {
          const { error: pErr } = await admin.from("profiles").insert({
            user_id: authRes.user.id,
            email,
            name: data.name,
            cpf: cpfDigits,
            phone: (data.phone || "").replace(/\D/g, ""),
            whatsapp: ((data.whatsapp ?? data.phone) || "").replace(/\D/g, ""),
            address: data.address,
            city: data.city,
            state: data.state,
            status: data.status ?? "ativo",
            notes: data.notes,
            consultor_id: consultorId,
            consultor_user_id: consultorUserId,
          });
          if (pErr) throw pErr;
          const { error: rErr } = await admin.from("user_roles").insert({
            user_id: authRes.user.id,
            role: "cliente",
          });
          if (rErr) throw rErr;
        } catch (e: any) {
          await admin.auth.admin.deleteUser(authRes.user.id).catch(() => {});
          return bad(400, e?.message || "Falha ao criar cliente.");
        }
        return ok({ userId: authRes.user.id });
      }

      case "updateClient": {
        const admF = await isAdmin();
        const conF = await isConsultor();
        if (!admF && !conF) return bad(403, "Permissão insuficiente.");
        const { id, consultorId, cpf, phone, whatsapp, ...rest } = data;
        if (cpf) {
          const cpfDigits = sanitizeCpf(cpf);
          if (!isValidCpf(cpfDigits)) return bad(400, "CPF inválido.");
          if (await cpfExists(cpfDigits, id))
            return bad(409, "CPF já cadastrado.");
          (rest as any).cpf = cpfDigits;
        }
        if (phone !== undefined) (rest as any).phone = (phone || "").replace(/\D/g, "");
        if (whatsapp !== undefined)
          (rest as any).whatsapp = (whatsapp || "").replace(/\D/g, "");
        if (consultorId) {
          const { data: cons } = await admin
            .from("profiles").select("user_id").eq("id", consultorId).maybeSingle();
          (rest as any).consultor_id = consultorId;
          (rest as any).consultor_user_id = cons?.user_id ?? null;
        }
        const { error } = await admin.from("profiles").update(rest).eq("id", id);
        if (error) throw error;
        return ok({ ok: true });
      }

      case "deleteClient": {
        const admF = await isAdmin();
        const conF = await isConsultor();
        if (!admF && !conF) return bad(403, "Permissão insuficiente.");
        const { data: profile } = await admin
          .from("profiles").select("user_id").eq("id", data.id).maybeSingle();
        if (!profile) return bad(404, "Registro não localizado.");
        const { error } = await admin.auth.admin.deleteUser(profile.user_id);
        if (error) throw error;
        return ok({ ok: true });
      }

      case "resetClientPassword": {
        const admF = await isAdmin();
        const conF = await isConsultor();
        if (!admF && !conF) return bad(403, "Permissão insuficiente.");
        const { data: profile } = await admin
          .from("profiles").select("user_id, consultor_id").eq("id", data.id).maybeSingle();
        if (!profile) return bad(404, "Cliente não localizado.");
        if (!admF) {
          const { data: me } = await admin
            .from("profiles").select("id").eq("user_id", userId).maybeSingle();
          if (!me || profile.consultor_id !== me.id)
            return bad(403, "Permissão insuficiente.");
        }
        const { error } = await admin.auth.admin.updateUserById(profile.user_id, {
          password: data.password,
        });
        if (error) throw error;
        return ok({ ok: true });
      }

      case "listConsultores": {
        if (!(await isAdmin())) return bad(403, "Permissão insuficiente.");
        const { data: roles } = await admin
          .from("user_roles").select("user_id").eq("role", "consultor");
        const ids = (roles ?? []).map((r: any) => r.user_id);
        if (!ids.length) return ok([]);
        const { data, error } = await admin
          .from("profiles").select("id, name").in("user_id", ids);
        if (error) throw error;
        return ok(data ?? []);
      }

      case "getDashboardStats": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const [cliQ, consQ, cdQ, cvQ, recQ, rolesQ] = await Promise.all([
          admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "cliente"),
          admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "consultor"),
          admin.from("cartas").select("*", { count: "exact", head: true }).eq("situacao", "disponivel"),
          admin.from("cartas").select("*", { count: "exact", head: true }).eq("situacao", "vendida"),
          admin.from("profiles").select("id, user_id, name, created_at").order("created_at", { ascending: false }).limit(5),
          admin.from("user_roles").select("user_id, role"),
        ]);
        const roleMap = new Map((rolesQ.data ?? []).map((r: any) => [r.user_id, r.role]));
        return ok({
          clientes: cliQ.count ?? 0,
          consultores: consQ.count ?? 0,
          cartasDisponiveis: cdQ.count ?? 0,
          cartasVendidas: cvQ.count ?? 0,
          recentes: (recQ.data ?? []).map((r: any) => ({
            id: r.id, name: r.name,
            role: roleMap.get(r.user_id), createdAt: r.created_at,
          })),
        });
      }

      // =============== PROFILE (CLIENTE) ===============
      case "getMyProfile": {
        const { data: p, error } = await admin
          .from("profiles")
          .select(
            "id, name, cpf, rg, birth_date, marital_status, profession, phone, whatsapp, email, status, consultor_id, cep, street, number, complement, neighborhood, city, state, country, rg_doc_path, cnh_doc_path, address_proof_path",
          )
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        let consultor: any = null;
        if (p?.consultor_id) {
          const { data: c } = await admin
            .from("profiles").select("name").eq("id", p.consultor_id).maybeSingle();
          consultor = c ?? null;
        }
        const signIfAny = async (path?: string | null) => {
          if (!path) return null;
          const { data: s } = await admin.storage
            .from("client-documents")
            .createSignedUrl(path, 60 * 30);
          return s?.signedUrl ?? null;
        };
        const [rg_url, cnh_url, addr_url] = await Promise.all([
          signIfAny(p?.rg_doc_path),
          signIfAny(p?.cnh_doc_path),
          signIfAny(p?.address_proof_path),
        ]);
        return ok(
          p
            ? { ...p, consultor, rg_doc_url: rg_url, cnh_doc_url: cnh_url, address_proof_url: addr_url }
            : null,
        );
      }

      case "updateMyProfile": {
        const clean = (v: any) =>
          typeof v === "string" ? v.trim() || null : v ?? null;
        const digits = (v: any) =>
          (typeof v === "string" ? v.replace(/\D/g, "") : "") || null;
        const patch: Record<string, any> = {
          name: (data.name || "").trim(),
          rg: clean(data.rg),
          birth_date: clean(data.birth_date),
          marital_status: clean(data.marital_status),
          profession: clean(data.profession),
          phone: digits(data.phone),
          whatsapp: digits(data.whatsapp) ?? digits(data.phone),
          cep: digits(data.cep),
          street: clean(data.street),
          number: clean(data.number),
          complement: clean(data.complement),
          neighborhood: clean(data.neighborhood),
          city: clean(data.city),
          state: clean(data.state),
          country: clean(data.country) ?? "Brasil",
        };

        // E-mail: cliente pode definir/alterar o próprio e-mail real (sincroniza com auth).
        if (typeof data.email === "string") {
          const newEmail = data.email.trim().toLowerCase();
          if (newEmail) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
              return bad(400, "E-mail inválido.");
            }
            const { data: current } = await admin
              .from("profiles").select("email").eq("user_id", userId).maybeSingle();
            if (((current as any)?.email || "").toLowerCase() !== newEmail) {
              if (await emailExists(newEmail, userId)) {
                return bad(409, "E-mail já cadastrado.");
              }
              const { error: aErr } = await admin.auth.admin.updateUserById(userId, {
                email: newEmail,
                email_confirm: true,
              });
              if (aErr) return bad(400, aErr.message || "Falha ao atualizar e-mail.");
              patch.email = newEmail;
            }
          }
        }

        const { error } = await admin
          .from("profiles").update(patch).eq("user_id", userId);
        if (error) throw error;
        return ok({ ok: true });
      }

      case "saveMyDocument": {
        // data: { kind: 'rg'|'cnh'|'address_proof', path: string }
        const map: Record<string, string> = {
          rg: "rg_doc_path",
          cnh: "cnh_doc_path",
          address_proof: "address_proof_path",
        };
        const col = map[data.kind];
        if (!col) return bad(400, "Tipo de documento inválido.");
        if (!data.path || typeof data.path !== "string")
          return bad(400, "Caminho inválido.");
        if (!data.path.startsWith(`${userId}/`))
          return bad(403, "Caminho fora da sua pasta.");
        // Remove arquivo anterior se existir
        const { data: prev } = await admin
          .from("profiles").select(col).eq("user_id", userId).maybeSingle();
        const oldPath = (prev as any)?.[col];
        if (oldPath && oldPath !== data.path) {
          await admin.storage.from("client-documents").remove([oldPath]).catch(() => {});
        }
        const { error } = await admin
          .from("profiles").update({ [col]: data.path }).eq("user_id", userId);
        if (error) throw error;
        return ok({ ok: true });
      }

      case "deleteMyDocument": {
        const map: Record<string, string> = {
          rg: "rg_doc_path",
          cnh: "cnh_doc_path",
          address_proof: "address_proof_path",
        };
        const col = map[data.kind];
        if (!col) return bad(400, "Tipo de documento inválido.");
        const { data: prev } = await admin
          .from("profiles").select(col).eq("user_id", userId).maybeSingle();
        const oldPath = (prev as any)?.[col];
        if (oldPath) {
          await admin.storage.from("client-documents").remove([oldPath]).catch(() => {});
        }
        const { error } = await admin
          .from("profiles").update({ [col]: null }).eq("user_id", userId);
        if (error) throw error;
        return ok({ ok: true });
      }

      // =============== CARTAS ===============
      case "listCartas": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const [{ data: cartas, error }, { data: profiles }] = await Promise.all([
          admin.from("cartas").select("*").order("created_at", { ascending: false }),
          admin.from("profiles").select("id, name, cpf"),
        ]);
        if (error) throw error;
        const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
        return ok(
          (cartas ?? []).map((c: any) => ({
            ...c,
            cliente: c.cliente_id ? pMap.get(c.cliente_id) ?? null : null,
          })),
        );
      }

      case "getConfig": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const { data } = await admin.from("app_config").select("key,value");
        const map: Record<string, any> = {};
        (data ?? []).forEach((r: any) => (map[r.key] = r.value));
        return ok({
          percentual_administrativo_padrao: Number(
            map.percentual_administrativo_padrao ?? 12,
          ),
        });
      }

      case "setConfig": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const { error } = await admin.from("app_config").upsert({
          key: "percentual_administrativo_padrao",
          value: data.percentual_administrativo_padrao,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        return ok({ ok: true });
      }

      case "listModelos": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const { data, error } = await admin
          .from("carta_modelos").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return ok(data ?? []);
      }

      case "saveModelo": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const payload: any = {
          nome: data.nome,
          administradora: data.administradora ?? null,
          valor_bem: data.valor_bem,
          parcelas_totais: data.parcelas_totais,
          percentual_administrativo: data.percentual_administrativo,
          descricao: data.descricao ?? null,
          created_by: userId,
        };
        if (data.id) {
          const { error } = await admin
            .from("carta_modelos").update(payload).eq("id", data.id);
          if (error) throw error;
          return ok({ id: data.id });
        }
        const { data: ins, error } = await admin
          .from("carta_modelos").insert(payload).select("id").single();
        if (error) throw error;
        return ok({ id: ins.id });
      }

      case "deleteModelo": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const { error } = await admin
          .from("carta_modelos").delete().eq("id", data.id);
        if (error) throw error;
        return ok({ ok: true });
      }

      case "upsertCarta": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const calc = calcularCarta({
          valor_bem: data.valor_bem,
          parcelas_totais: data.parcelas_totais,
          percentual_administrativo: data.percentual_administrativo,
        });
        const primeiro = calcularPrimeiroVencimento(data.data_adesao);
        const diaVenc = 10;

        let pagas: any[] = [];
        if (data.id) {
          const { data: p } = await admin
            .from("carta_parcelas").select("*")
            .eq("carta_id", data.id).eq("status", "pago");
          pagas = p ?? [];
        }

        const payload: any = {
          administradora: data.administradora,
          grupo: data.grupo,
          cota: data.cota,
          cliente_id: data.cliente_id ?? null,
          valor: calc.valor_bem,
          valor_bem: calc.valor_bem,
          valor_administrativo: calc.valor_administrativo,
          valor_total: calc.valor_total,
          percentual_administrativo: data.percentual_administrativo,
          saldo_devedor: calc.valor_total,
          valores_pagos: 0,
          credito_disponivel: 0,
          data_adesao: data.data_adesao,
          primeiro_vencimento: primeiro,
          prazo: data.parcelas_totais,
          parcelas_totais: data.parcelas_totais,
          parcelas_pagas: pagas.length,
          parcela: calc.parcelas[0],
          dia_vencimento: diaVenc,
          situacao: data.situacao ?? "disponivel",
          descricao: data.descricao ?? null,
          taxa_mensal: 0,
          valor_entrada: 0,
        };

        let cartaId = data.id;
        let isNew = false;
        if (cartaId) {
          const { error } = await admin.from("cartas").update(payload).eq("id", cartaId);
          if (error) throw error;
        } else {
          const { data: ins, error } = await admin
            .from("cartas").insert(payload).select("id").single();
          if (error) throw error;
          cartaId = ins.id;
          isNew = true;
        }

        const pagasSet = new Set(pagas.map((p) => p.numero));
        await admin
          .from("carta_parcelas").delete()
          .eq("carta_id", cartaId).neq("status", "pago");

        const start = new Date(primeiro + "T12:00:00");
        const rows: any[] = [];
        for (let i = 0; i < data.parcelas_totais; i++) {
          if (pagasSet.has(i + 1)) continue;
          const venc = addMonthsKeepDay(start, i, diaVenc);
          rows.push({
            carta_id: cartaId,
            numero: i + 1,
            vencimento: toISODate(venc),
            valor: calc.parcelas[i],
            status: "pendente",
          });
        }
        if (rows.length) {
          const { error } = await admin.from("carta_parcelas").insert(rows);
          if (error) throw error;
        }

        await logHistory(cartaId, isNew ? "carta_criada" : "carta_atualizada", {
          amount: calc.valor_total,
          notes: `Valor bem ${calc.valor_bem} · ${data.parcelas_totais}x · ${data.percentual_administrativo}% admin · 1º venc ${primeiro}`,
        });
        await refreshAtraso(cartaId);
        return ok({ id: cartaId });
      }

      case "getCarta": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        await refreshAtraso(data.id);
        const [{ data: carta }, { data: parcelas }] = await Promise.all([
          admin.from("cartas").select("*").eq("id", data.id).maybeSingle(),
          admin.from("carta_parcelas").select("*").eq("carta_id", data.id).order("numero", { ascending: true }),
        ]);
        if (!carta) return bad(404, "Carta não localizada.");
        let cliente: any = null;
        if ((carta as any).cliente_id) {
          const { data: c } = await admin
            .from("profiles").select("id, name, cpf").eq("id", (carta as any).cliente_id).maybeSingle();
          cliente = c ?? null;
        }
        const list = parcelas ?? [];
        const pagas = list.filter((p: any) => p.status === "pago");
        const atraso = list.filter((p: any) => p.status === "atraso");
        const pendentes = list.filter((p: any) => p.status === "pendente");
        const totalPago = pagas.reduce((s: number, p: any) => s + Number(p.valor), 0);
        const totalAtraso = atraso.reduce((s: number, p: any) => s + Number(p.valor), 0);
        const totalAberto = pendentes.reduce((s: number, p: any) => s + Number(p.valor), 0);
        const valorTotal = Number((carta as any).valor_total ?? 0);
        const percQuit = valorTotal > 0 ? (totalPago / valorTotal) * 100 : 0;
        return ok({
          carta: { ...carta, cliente },
          parcelas: list,
          dashboard: {
            total_pago: round2(totalPago),
            total_aberto: round2(totalAberto),
            total_atraso: round2(totalAtraso),
            parcelas_pagas: pagas.length,
            parcelas_pendentes: pendentes.length,
            parcelas_atraso: atraso.length,
            percentual_quitado: Math.round(percQuit * 100) / 100,
            percentual_restante: Math.round((100 - percQuit) * 100) / 100,
          },
        });
      }

      case "deleteCarta": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const { error } = await admin.from("cartas").delete().eq("id", data.id);
        if (error) throw error;
        return ok({ ok: true });
      }

      case "toggleParcelaPaga": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const { data: parcela } = await admin
          .from("carta_parcelas").select("*").eq("id", data.id).maybeSingle();
        if (!parcela) return bad(404, "Parcela não localizada.");
        const newStatus = data.pago ? "pago" : "pendente";
        const pagoEm = data.pago
          ? paymentDateFromVencimento((parcela as any).vencimento)
          : null;
        const { error } = await admin
          .from("carta_parcelas")
          .update({
            status: newStatus,
            pago_em: pagoEm,
            pago_por: data.pago ? userId : null,
            observacoes: data.notes ?? (parcela as any).observacoes ?? null,
          } as any)
          .eq("id", data.id);
        if (error) throw error;

        const { count } = await admin
          .from("carta_parcelas")
          .select("*", { count: "exact", head: true })
          .eq("carta_id", (parcela as any).carta_id)
          .eq("status", "pago");
        await admin
          .from("cartas")
          .update({ parcelas_pagas: count ?? 0 })
          .eq("id", (parcela as any).carta_id);

        await logHistory(
          (parcela as any).carta_id,
          data.pago ? "pagamento_registrado" : "pagamento_estornado",
          {
            installment_number: (parcela as any).numero,
            due_date: (parcela as any).vencimento,
            amount: Number((parcela as any).valor),
            status: newStatus,
            payment_date: pagoEm,
            notes: data.notes ?? null,
          },
          pagoEm,
        );
        await refreshAtraso((parcela as any).carta_id);
        return ok({ ok: true });
      }

      case "listPaymentHistory": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const { data: rows, error } = await admin
          .from("payment_history").select("*")
          .eq("carta_id", data.carta_id).order("created_at", { ascending: false });
        if (error) throw error;
        const userIds = Array.from(new Set((rows ?? []).map((r: any) => r.created_by).filter(Boolean)));
        let nameMap = new Map<string, string>();
        if (userIds.length) {
          const { data: profs } = await admin
            .from("profiles").select("user_id, name").in("user_id", userIds as string[]);
          nameMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.name]));
        }
        return ok(
          (rows ?? []).map((r: any) => ({
            ...r,
            created_by_name: nameMap.get(r.created_by) ?? "Sistema",
          })),
        );
      }

      case "markAllParcelasPagas": {
        if (!(await isStaff())) return bad(403, "Permissão insuficiente.");
        const { data: parcelas, error } = await admin
          .from("carta_parcelas").select("*")
          .eq("carta_id", data.carta_id).neq("status", "pago")
          .order("numero", { ascending: true });
        if (error) throw error;
        for (const p of parcelas ?? []) {
          const pagoEm = paymentDateFromVencimento((p as any).vencimento);
          const { error: uErr } = await admin
            .from("carta_parcelas")
            .update({ status: "pago", pago_em: pagoEm, pago_por: userId } as any)
            .eq("id", (p as any).id);
          if (uErr) throw uErr;
          await logHistory(
            data.carta_id,
            "pagamento_registrado",
            {
              installment_number: (p as any).numero,
              due_date: (p as any).vencimento,
              amount: Number((p as any).valor),
              status: "pago",
              payment_date: pagoEm,
              notes: "Baixa em lote (todas as parcelas)",
            },
            pagoEm,
          );
        }
        const { count } = await admin
          .from("carta_parcelas")
          .select("*", { count: "exact", head: true })
          .eq("carta_id", data.carta_id).eq("status", "pago");
        await admin
          .from("cartas").update({ parcelas_pagas: count ?? 0 })
          .eq("id", data.carta_id);
        return ok({ ok: true, marked: (parcelas ?? []).length });
      }

      case "listMinhasCartas": {
        const { data: profile } = await admin
          .from("profiles").select("id").eq("user_id", userId).maybeSingle();
        if (!profile) return ok([]);
        const { data: cartas, error } = await admin
          .from("cartas").select("*")
          .eq("cliente_id", (profile as any).id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        const ids = (cartas ?? []).map((c: any) => c.id);
        const proxByCarta = new Map<string, any>();
        if (ids.length) {
          const { data: parcs } = await admin
            .from("carta_parcelas")
            .select("carta_id, numero, vencimento, valor, status")
            .in("carta_id", ids).neq("status", "pago")
            .order("vencimento", { ascending: true });
          for (const p of parcs ?? []) {
            if (!proxByCarta.has((p as any).carta_id)) {
              proxByCarta.set((p as any).carta_id, p);
            }
          }
        }
        return ok(
          (cartas ?? []).map((c: any) => ({
            ...c,
            proxima_parcela: proxByCarta.get(c.id) ?? null,
          })),
        );
      }

      default:
        return bad(400, `Ação desconhecida: ${action}`);
    }
  } catch (e: any) {
    console.error("[bbc-api] erro", action, e);
    return bad(500, e?.message || "Erro interno.");
  }
});
