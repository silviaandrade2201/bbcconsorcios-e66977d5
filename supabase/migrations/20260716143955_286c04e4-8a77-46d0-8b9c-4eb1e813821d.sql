
-- === CARTAS: novos campos ===
ALTER TABLE public.cartas
  ADD COLUMN IF NOT EXISTS percentual_administrativo numeric NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS valor_administrativo numeric,
  ADD COLUMN IF NOT EXISTS valor_total numeric,
  ADD COLUMN IF NOT EXISTS primeiro_vencimento date;

-- === PARCELAS: auditoria ===
ALTER TABLE public.carta_parcelas
  ADD COLUMN IF NOT EXISTS pago_por uuid,
  ADD COLUMN IF NOT EXISTS observacoes text;

-- Trigger: bloqueia alteração de valor/numero/carta_id em parcela paga
CREATE OR REPLACE FUNCTION public.protect_paid_parcela()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'pago' THEN
    IF NEW.valor <> OLD.valor OR NEW.numero <> OLD.numero OR NEW.carta_id <> OLD.carta_id THEN
      RAISE EXCEPTION 'Parcela paga não pode ter valor, número ou carta alterados.';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_paid_parcela ON public.carta_parcelas;
CREATE TRIGGER trg_protect_paid_parcela
  BEFORE UPDATE ON public.carta_parcelas
  FOR EACH ROW EXECUTE FUNCTION public.protect_paid_parcela();

-- === PAYMENT_HISTORY ===
CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carta_id uuid NOT NULL REFERENCES public.cartas(id) ON DELETE CASCADE,
  installment_number integer,
  due_date date,
  amount numeric,
  status text,
  payment_date timestamptz,
  event_type text NOT NULL,
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.payment_history TO authenticated;
GRANT ALL ON public.payment_history TO service_role;

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read history" ON public.payment_history;
CREATE POLICY "staff read history" ON public.payment_history
  FOR SELECT TO authenticated
  USING (internal.has_role(auth.uid(),'admin') OR internal.has_role(auth.uid(),'consultor'));

DROP POLICY IF EXISTS "cliente read own history" ON public.payment_history;
CREATE POLICY "cliente read own history" ON public.payment_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cartas c JOIN public.profiles p ON p.id = c.cliente_id
    WHERE c.id = payment_history.carta_id AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "staff insert history" ON public.payment_history;
CREATE POLICY "staff insert history" ON public.payment_history
  FOR INSERT TO authenticated
  WITH CHECK (internal.has_role(auth.uid(),'admin') OR internal.has_role(auth.uid(),'consultor'));

-- Bloqueia DELETE em histórico
CREATE OR REPLACE FUNCTION public.block_history_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Histórico financeiro não pode ser excluído.'; END $$;
DROP TRIGGER IF EXISTS trg_block_history_delete ON public.payment_history;
CREATE TRIGGER trg_block_history_delete
  BEFORE DELETE ON public.payment_history
  FOR EACH ROW EXECUTE FUNCTION public.block_history_delete();

CREATE INDEX IF NOT EXISTS idx_payment_history_carta ON public.payment_history(carta_id, created_at DESC);

-- === CARTA_MODELOS ===
CREATE TABLE IF NOT EXISTS public.carta_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  administradora text,
  valor_bem numeric NOT NULL,
  parcelas_totais integer NOT NULL,
  percentual_administrativo numeric NOT NULL DEFAULT 12,
  descricao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.carta_modelos TO authenticated;
GRANT ALL ON public.carta_modelos TO service_role;

ALTER TABLE public.carta_modelos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage modelos" ON public.carta_modelos;
CREATE POLICY "staff manage modelos" ON public.carta_modelos
  FOR ALL TO authenticated
  USING (internal.has_role(auth.uid(),'admin') OR internal.has_role(auth.uid(),'consultor'))
  WITH CHECK (internal.has_role(auth.uid(),'admin') OR internal.has_role(auth.uid(),'consultor'));

DROP TRIGGER IF EXISTS update_carta_modelos_updated_at ON public.carta_modelos;
CREATE TRIGGER update_carta_modelos_updated_at
  BEFORE UPDATE ON public.carta_modelos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === APP_CONFIG ===
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read config" ON public.app_config;
CREATE POLICY "authenticated read config" ON public.app_config
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.app_config(key, value) VALUES ('percentual_administrativo_padrao', '12'::jsonb)
ON CONFLICT (key) DO NOTHING;
