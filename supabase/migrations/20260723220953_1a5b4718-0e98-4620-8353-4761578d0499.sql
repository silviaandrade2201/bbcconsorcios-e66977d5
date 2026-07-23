
CREATE TABLE public.simulacao_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  credito NUMERIC(14,2) NOT NULL,
  prazo INTEGER NOT NULL,
  parcela NUMERIC(14,2) NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  nascimento DATE,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'novo',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.simulacao_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.simulacao_leads TO authenticated;
GRANT ALL ON public.simulacao_leads TO service_role;

ALTER TABLE public.simulacao_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.simulacao_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage leads"
  ON public.simulacao_leads
  FOR ALL
  TO authenticated
  USING (internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (internal.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultores can manage leads"
  ON public.simulacao_leads
  FOR ALL
  TO authenticated
  USING (internal.has_role(auth.uid(), 'consultor'::app_role))
  WITH CHECK (internal.has_role(auth.uid(), 'consultor'::app_role));

CREATE TRIGGER update_simulacao_leads_updated_at
  BEFORE UPDATE ON public.simulacao_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_simulacao_leads_created_at ON public.simulacao_leads (created_at DESC);
