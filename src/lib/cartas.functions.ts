import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PRESET_PRAZOS = [12, 24, 36, 48, 60, 72, 84, 120] as const;

// ============ Helpers de cálculo ============
export function calcularCarta(input: {
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

export function calcularPrimeiroVencimento(data_adesao: string): string {
  const d = new Date(data_adesao + "T12:00:00");
  const dia = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth(), 10, 12, 0, 0);
  if (dia >= 10) target.setMonth(target.getMonth() + 1);
  return toISODate(target);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function pad(n: number) { return String(n).padStart(2, "0"); }
function round2(n: number) { return Math.round(n * 100) / 100; }

function addMonthsKeepDay(base: Date, months: number, dia: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth() + months, 1, 12, 0, 0);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dia, last));
  return d;
}

// legacy no-op, mantido para não quebrar imports antigos
export function calcParcela(saldo: number, prazo: number) {
  if (!saldo || !prazo) return 0;
  return round2(saldo / prazo);
}

async function checkStaff(ctx: { userId: string }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .in("role", ["admin", "consultor"]);
  return (data ?? []).length > 0;
}

async function logHistory(
  carta_id: string,
  event_type: string,
  data: {
    installment_number?: number | null;
    due_date?: string | null;
    amount?: number | null;
    status?: string | null;
    payment_date?: string | null;
    notes?: string | null;
  },
  user_id: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await (supabaseAdmin as any).from("payment_history").insert({
    carta_id,
    event_type,
    installment_number: data.installment_number ?? null,
    due_date: data.due_date ?? null,
    amount: data.amount ?? null,
    status: data.status ?? null,
    payment_date: data.payment_date ?? null,
    notes: data.notes ?? null,
    created_by: user_id,
    updated_by: user_id,
  });
}

function paymentDateFromVencimento(vencimento: string): string {
  // Data de vencimento + horário aleatório entre 08:00 e 19:59
  const h = 8 + Math.floor(Math.random() * 12);
  const m = Math.floor(Math.random() * 60);
  const s = Math.floor(Math.random() * 60);
  const local = new Date(`${vencimento}T${pad(h)}:${pad(m)}:${pad(s)}`);
  return local.toISOString();
}

async function logHistoryAt(
  carta_id: string,
  event_type: string,
  data: {
    installment_number?: number | null;
    due_date?: string | null;
    amount?: number | null;
    status?: string | null;
    payment_date?: string | null;
    notes?: string | null;
  },
  user_id: string,
  created_at?: string | null,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const row: any = {
    carta_id,
    event_type,
    installment_number: data.installment_number ?? null,
    due_date: data.due_date ?? null,
    amount: data.amount ?? null,
    status: data.status ?? null,
    payment_date: data.payment_date ?? null,
    notes: data.notes ?? null,
    created_by: user_id,
    updated_by: user_id,
  };
  if (created_at) row.created_at = created_at;
  await (supabaseAdmin as any).from("payment_history").insert(row);
}


// ============ Schemas ============
const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  administradora: z.string().min(1, "Informe a administradora"),
  grupo: z.string().min(1, "Informe o grupo"),
  cota: z.string().min(1, "Informe a cota"),
  cliente_id: z.string().uuid().nullable().optional(),
  valor_bem: z.number().positive("Valor do bem obrigatório"),
  parcelas_totais: z.number().int().min(1).max(360),
  data_adesao: z.string().min(1, "Informe a data de adesão"),
  percentual_administrativo: z.number().nonnegative().default(12),
  situacao: z.enum(["disponivel", "reservada", "vendida"]).default("disponivel"),
  descricao: z.string().nullable().optional(),
});

// ============ Server functions ============

export const listCartas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: cartas, error }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("cartas").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("profiles").select("id, name, cpf"),
    ]);
    if (error) throw error;
    const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (cartas ?? []).map((c: any) => ({
      ...c,
      cliente: c.cliente_id ? pMap.get(c.cliente_id) ?? null : null,
    }));
  });

export const getConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("app_config")
      .select("key,value");
    const map: Record<string, any> = {};
    (data ?? []).forEach((r: any) => (map[r.key] = r.value));
    return {
      percentual_administrativo_padrao:
        Number(map.percentual_administrativo_padrao ?? 12),
    };
  });

export const setConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ percentual_administrativo_padrao: z.number().nonnegative() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("app_config")
      .upsert({
        key: "percentual_administrativo_padrao",
        value: data.percentual_administrativo_padrao,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
    return { ok: true };
  });

// ---- Modelos ----
export const listModelos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("carta_modelos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const modeloSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "Informe um nome"),
  administradora: z.string().nullable().optional(),
  valor_bem: z.number().positive(),
  parcelas_totais: z.number().int().min(1).max(360),
  percentual_administrativo: z.number().nonnegative().default(12),
  descricao: z.string().nullable().optional(),
});

export const saveModelo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => modeloSchema.parse(i))
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: any = {
      nome: data.nome,
      administradora: data.administradora ?? null,
      valor_bem: data.valor_bem,
      parcelas_totais: data.parcelas_totais,
      percentual_administrativo: data.percentual_administrativo,
      descricao: data.descricao ?? null,
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await (supabaseAdmin as any)
        .from("carta_modelos").update(payload).eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: ins, error } = await (supabaseAdmin as any)
      .from("carta_modelos").insert(payload).select("id").single();
    if (error) throw error;
    return { id: ins.id };
  });

export const deleteModelo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("carta_modelos").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---- Carta principal ----
export const upsertCarta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => upsertSchema.parse(i))
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const calc = calcularCarta({
      valor_bem: data.valor_bem,
      parcelas_totais: data.parcelas_totais,
      percentual_administrativo: data.percentual_administrativo,
    });
    const primeiro = calcularPrimeiroVencimento(data.data_adesao);
    const diaVenc = 10;

    // Carrega parcelas pagas existentes se update
    let pagas: any[] = [];
    if (data.id) {
      const { data: p } = await supabaseAdmin
        .from("carta_parcelas")
        .select("*")
        .eq("carta_id", data.id)
        .eq("status", "pago");
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
      situacao: data.situacao,
      descricao: data.descricao ?? null,
      taxa_mensal: 0,
      valor_entrada: 0,
    };

    let cartaId = data.id;
    let isNew = false;
    if (cartaId) {
      const { error } = await supabaseAdmin.from("cartas").update(payload).eq("id", cartaId);
      if (error) throw error;
    } else {
      const { data: ins, error } = await supabaseAdmin
        .from("cartas").insert(payload).select("id").single();
      if (error) throw error;
      cartaId = ins.id;
      isNew = true;
    }

    // Regera parcelas: apaga só as não pagas
    const pagasSet = new Set(pagas.map((p) => p.numero));
    await supabaseAdmin
      .from("carta_parcelas")
      .delete()
      .eq("carta_id", cartaId!)
      .neq("status", "pago");

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
      const { error } = await supabaseAdmin.from("carta_parcelas").insert(rows);
      if (error) throw error;
    }

    await logHistory(
      cartaId!,
      isNew ? "carta_criada" : "carta_atualizada",
      {
        amount: calc.valor_total,
        notes: `Valor bem ${calc.valor_bem} · ${data.parcelas_totais}x · ${data.percentual_administrativo}% admin · 1º venc ${primeiro}`,
      },
      context.userId,
    );

    // Atualiza status atraso das parcelas
    await refreshAtraso(cartaId!);

    return { id: cartaId };
  });

async function refreshAtraso(carta_id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = toISODate(new Date());
  // Marca atraso
  await supabaseAdmin
    .from("carta_parcelas")
    .update({ status: "atraso" })
    .eq("carta_id", carta_id)
    .neq("status", "pago")
    .lt("vencimento", today);
  // Volta pendentes
  await supabaseAdmin
    .from("carta_parcelas")
    .update({ status: "pendente" })
    .eq("carta_id", carta_id)
    .eq("status", "atraso")
    .gte("vencimento", today);
}

export const getCarta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    await refreshAtraso(data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: carta }, { data: parcelas }, { data: cliente }] = await Promise.all([
      supabaseAdmin.from("cartas").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin
        .from("carta_parcelas")
        .select("*")
        .eq("carta_id", data.id)
        .order("numero", { ascending: true }),
      supabaseAdmin
        .from("cartas")
        .select("cliente_id")
        .eq("id", data.id)
        .maybeSingle()
        .then(async ({ data: c }) => {
          if (!c?.cliente_id) return { data: null };
          return supabaseAdmin
            .from("profiles")
            .select("id, name, cpf")
            .eq("id", c.cliente_id)
            .maybeSingle();
        }),
    ]);
    if (!carta) throw new Error("Carta não localizada.");

    const list = parcelas ?? [];
    const pagas = list.filter((p: any) => p.status === "pago");
    const atraso = list.filter((p: any) => p.status === "atraso");
    const pendentes = list.filter((p: any) => p.status === "pendente");
    const totalPago = pagas.reduce((s: number, p: any) => s + Number(p.valor), 0);
    const totalAtraso = atraso.reduce((s: number, p: any) => s + Number(p.valor), 0);
    const totalAberto = pendentes.reduce((s: number, p: any) => s + Number(p.valor), 0);
    const valorTotal = Number((carta as any).valor_total ?? 0);
    const percQuit = valorTotal > 0 ? (totalPago / valorTotal) * 100 : 0;

    return {
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
    };
  });

export const deleteCarta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("cartas").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const toggleParcelaPaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().uuid(), pago: z.boolean(), notes: z.string().optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: parcela } = await supabaseAdmin
      .from("carta_parcelas").select("*").eq("id", data.id).maybeSingle();
    if (!parcela) throw new Error("Parcela não localizada.");

    
    const newStatus = data.pago ? "pago" : "pendente";
    const pagoEm = data.pago
      ? paymentDateFromVencimento((parcela as any).vencimento)
      : null;

    const { error } = await supabaseAdmin
      .from("carta_parcelas")
      .update({
        status: newStatus,
        pago_em: pagoEm,
        pago_por: data.pago ? context.userId : null,
        observacoes: data.notes ?? (parcela as any).observacoes ?? null,
      } as any)
      .eq("id", data.id);
    if (error) throw error;

    // Recalcula parcelas_pagas
    const { count } = await supabaseAdmin
      .from("carta_parcelas")
      .select("*", { count: "exact", head: true })
      .eq("carta_id", (parcela as any).carta_id)
      .eq("status", "pago");
    await supabaseAdmin
      .from("cartas")
      .update({ parcelas_pagas: count ?? 0 })
      .eq("id", (parcela as any).carta_id);

    await logHistoryAt(
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
      context.userId,
      pagoEm,
    );

    await refreshAtraso((parcela as any).carta_id);
    return { ok: true };
  });


export const listPaymentHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ carta_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("payment_history")
      .select("*")
      .eq("carta_id", data.carta_id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const userIds = Array.from(new Set((rows ?? []).map((r: any) => r.created_by).filter(Boolean)));
    let nameMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles").select("user_id, name").in("user_id", userIds as string[]);
      nameMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.name]));
    }
    return (rows ?? []).map((r: any) => ({
      ...r,
      created_by_name: nameMap.get(r.created_by) ?? "Sistema",
    }));
  });
