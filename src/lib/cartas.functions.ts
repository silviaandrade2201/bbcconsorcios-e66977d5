import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TAXA_MENSAL = 0.0012;

export const PRESET_PRAZOS = [12, 24, 36, 48, 60, 72, 84, 120] as const;

/** Parcela Price: PMT = PV * i / (1 - (1+i)^-n). Se i = 0, PV/n. */
export function calcParcela(saldo: number, prazo: number, taxa = TAXA_MENSAL): number {
  if (!saldo || !prazo) return 0;
  if (taxa <= 0) return saldo / prazo;
  return (saldo * taxa) / (1 - Math.pow(1 + taxa, -prazo));
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

const cartaSchema = z.object({
  id: z.string().uuid().optional(),
  administradora: z.string().min(1, "Informe a administradora"),
  grupo: z.string().min(1, "Informe o grupo"),
  cota: z.string().min(1, "Informe a cota"),
  versao: z.string().optional().nullable(),
  valor_bem: z.number().nonnegative().optional().nullable(),
  saldo_devedor: z.number().nonnegative(),
  valores_pagos: z.number().nonnegative().default(0),
  credito_contemplacao: z.number().nonnegative().optional().nullable(),
  credito_disponivel: z.number().nonnegative().default(0),
  data_adesao: z.string().optional().nullable(),
  data_contemplacao: z.string().optional().nullable(),
  previsao_encerramento: z.string().optional().nullable(),
  parcelas_totais: z.number().int().positive(),
  parcelas_pagas: z.number().int().nonnegative().default(0),
  dia_vencimento: z.number().int().min(1).max(31),
  cliente_id: z.string().uuid().optional().nullable(),
  situacao: z.enum(["disponivel", "reservada", "vendida"]).default("disponivel"),
  descricao: z.string().optional().nullable(),
  taxa_mensal: z.number().nonnegative().default(TAXA_MENSAL),
  regenerar_parcelas: z.boolean().default(true),
  data_inicio_parcelas: z.string().optional().nullable(),
});

function addMonthsSafe(base: Date, months: number, dia: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dia, last));
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

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

export const getCarta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: carta }, { data: parcelas }] = await Promise.all([
      supabaseAdmin.from("cartas").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin
        .from("carta_parcelas")
        .select("*")
        .eq("carta_id", data.id)
        .order("numero", { ascending: true }),
    ]);
    if (!carta) throw new Error("Carta não localizada.");
    return { carta, parcelas: parcelas ?? [] };
  });

export const upsertCarta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => cartaSchema.parse(i))
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const taxa = data.taxa_mensal || TAXA_MENSAL;
    const parcelaValor = calcParcela(data.saldo_devedor, data.parcelas_totais, taxa);

    const payload = {
      administradora: data.administradora,
      grupo: data.grupo,
      cota: data.cota,
      versao: data.versao ?? null,
      valor: data.valor_bem ?? data.saldo_devedor,
      valor_bem: data.valor_bem ?? null,
      saldo_devedor: data.saldo_devedor,
      valores_pagos: data.valores_pagos,
      credito_contemplacao: data.credito_contemplacao ?? null,
      credito_disponivel: data.credito_disponivel,
      data_adesao: data.data_adesao || null,
      data_contemplacao: data.data_contemplacao || null,
      previsao_encerramento: data.previsao_encerramento || null,
      prazo: data.parcelas_totais,
      parcelas_totais: data.parcelas_totais,
      parcelas_pagas: data.parcelas_pagas,
      parcela: Math.round(parcelaValor * 100) / 100,
      dia_vencimento: data.dia_vencimento,
      cliente_id: data.cliente_id ?? null,
      situacao: data.situacao,
      descricao: data.descricao ?? null,
      taxa_mensal: taxa,
      valor_entrada: 0,
    };

    let cartaId = data.id;
    if (cartaId) {
      const { error } = await supabaseAdmin.from("cartas").update(payload).eq("id", cartaId);
      if (error) throw error;
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("cartas")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      cartaId = inserted.id;
    }

    if (data.regenerar_parcelas && cartaId) {
      await supabaseAdmin.from("carta_parcelas").delete().eq("carta_id", cartaId);

      const start = data.data_inicio_parcelas
        ? new Date(data.data_inicio_parcelas + "T12:00:00")
        : new Date();
      const rows = [];
      for (let i = 0; i < data.parcelas_totais; i++) {
        const venc = addMonthsSafe(start, i, data.dia_vencimento);
        const paga = i < data.parcelas_pagas;
        rows.push({
          carta_id: cartaId,
          numero: i + 1,
          vencimento: toISODate(venc),
          valor: Math.round(parcelaValor * 100) / 100,
          status: paga ? "pago" : "pendente",
          pago_em: paga ? new Date().toISOString() : null,
        });
      }
      if (rows.length) {
        const { error } = await supabaseAdmin.from("carta_parcelas").insert(rows);
        if (error) throw error;
      }
    }

    return { id: cartaId };
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
    z.object({ id: z.string().uuid(), pago: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    if (!(await checkStaff(context))) throw new Error("Permissão insuficiente.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("carta_parcelas")
      .update({
        status: data.pago ? "pago" : "pendente",
        pago_em: data.pago ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw error;

    // Recalcula parcelas_pagas
    const { data: parc } = await supabaseAdmin
      .from("carta_parcelas")
      .select("carta_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (parc?.carta_id) {
      const { count } = await supabaseAdmin
        .from("carta_parcelas")
        .select("*", { count: "exact", head: true })
        .eq("carta_id", parc.carta_id)
        .eq("status", "pago");
      await supabaseAdmin
        .from("cartas")
        .update({ parcelas_pagas: count ?? 0 })
        .eq("id", parc.carta_id);
    }
    return { ok: true };
  });
