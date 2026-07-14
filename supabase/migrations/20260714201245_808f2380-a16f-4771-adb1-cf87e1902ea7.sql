
ALTER TABLE public.cartas
  ADD COLUMN IF NOT EXISTS versao TEXT,
  ADD COLUMN IF NOT EXISTS valor_bem NUMERIC,
  ADD COLUMN IF NOT EXISTS saldo_devedor NUMERIC,
  ADD COLUMN IF NOT EXISTS valores_pagos NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credito_contemplacao NUMERIC,
  ADD COLUMN IF NOT EXISTS credito_disponivel NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_adesao DATE,
  ADD COLUMN IF NOT EXISTS data_contemplacao DATE,
  ADD COLUMN IF NOT EXISTS previsao_encerramento DATE,
  ADD COLUMN IF NOT EXISTS parcelas_totais INTEGER,
  ADD COLUMN IF NOT EXISTS parcelas_pagas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER,
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS taxa_mensal NUMERIC NOT NULL DEFAULT 0.0012;

ALTER TABLE public.cartas ALTER COLUMN valor DROP NOT NULL;
ALTER TABLE public.cartas ALTER COLUMN prazo DROP NOT NULL;
ALTER TABLE public.cartas ALTER COLUMN parcela DROP NOT NULL;
ALTER TABLE public.cartas ALTER COLUMN valor_entrada DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.carta_parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carta_id UUID NOT NULL REFERENCES public.cartas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  vencimento DATE NOT NULL,
  valor NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (carta_id, numero)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.carta_parcelas TO authenticated;
GRANT ALL ON public.carta_parcelas TO service_role;

ALTER TABLE public.carta_parcelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage parcelas" ON public.carta_parcelas;
CREATE POLICY "Admins manage parcelas" ON public.carta_parcelas
  FOR ALL TO authenticated
  USING (internal.has_role(auth.uid(), 'admin'))
  WITH CHECK (internal.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Consultores manage parcelas" ON public.carta_parcelas;
CREATE POLICY "Consultores manage parcelas" ON public.carta_parcelas
  FOR ALL TO authenticated
  USING (internal.has_role(auth.uid(), 'consultor'))
  WITH CHECK (internal.has_role(auth.uid(), 'consultor'));

DROP POLICY IF EXISTS "Clientes read own parcelas" ON public.carta_parcelas;
CREATE POLICY "Clientes read own parcelas" ON public.carta_parcelas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cartas c
    JOIN public.profiles p ON p.id = c.cliente_id
    WHERE c.id = carta_parcelas.carta_id AND p.user_id = auth.uid()
  ));

DROP TRIGGER IF EXISTS update_carta_parcelas_updated_at ON public.carta_parcelas;
CREATE TRIGGER update_carta_parcelas_updated_at BEFORE UPDATE ON public.carta_parcelas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
