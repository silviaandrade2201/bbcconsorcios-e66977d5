
-- 1) Novas colunas em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rg TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS complement TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS rg_doc_path TEXT,
  ADD COLUMN IF NOT EXISTS cnh_doc_path TEXT,
  ADD COLUMN IF NOT EXISTS address_proof_path TEXT;

-- 2) Storage policies para o bucket 'client-documents'
-- Estrutura de pastas: <user_id>/<tipo>-<timestamp>.<ext>

DROP POLICY IF EXISTS "Clientes podem ler seus documentos" ON storage.objects;
CREATE POLICY "Clientes podem ler seus documentos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Clientes podem enviar seus documentos" ON storage.objects;
CREATE POLICY "Clientes podem enviar seus documentos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Clientes podem atualizar seus documentos" ON storage.objects;
CREATE POLICY "Clientes podem atualizar seus documentos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Clientes podem excluir seus documentos" ON storage.objects;
CREATE POLICY "Clientes podem excluir seus documentos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Staff pode ler documentos dos clientes" ON storage.objects;
CREATE POLICY "Staff pode ler documentos dos clientes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (
      internal.has_role(auth.uid(), 'admin'::app_role)
      OR internal.has_role(auth.uid(), 'consultor'::app_role)
    )
  );
