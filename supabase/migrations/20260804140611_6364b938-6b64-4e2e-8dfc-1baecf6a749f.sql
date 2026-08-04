
-- 1. app_config: remove redundant unrestricted public policy, scope anon to public keys only
DROP POLICY IF EXISTS "public read config" ON public.app_config;
DROP POLICY IF EXISTS "authenticated read config" ON public.app_config;

CREATE POLICY "authenticated read config"
ON public.app_config FOR SELECT TO authenticated
USING (true);

CREATE POLICY "anon read public config keys"
ON public.app_config FOR SELECT TO anon
USING (key IN ('whatsapp_numero', 'whatsapp_mensagem'));

-- 2. simulacao_leads: replace WITH CHECK (true) with validated insert policy
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.simulacao_leads;

CREATE POLICY "Anyone can submit a validated lead"
ON public.simulacao_leads FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(nome)) BETWEEN 2 AND 120
  AND length(btrim(email)) BETWEEN 5 AND 255
  AND email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(regexp_replace(cpf, '\D', '', 'g')) = 11
  AND length(regexp_replace(telefone, '\D', '', 'g')) BETWEEN 10 AND 13
  AND length(btrim(categoria)) BETWEEN 2 AND 60
  AND credito > 0 AND credito <= 100000000
  AND prazo > 0 AND prazo <= 600
  AND parcela > 0 AND parcela <= 10000000
  AND (observacoes IS NULL OR length(observacoes) <= 2000)
  AND status = 'novo'
);
