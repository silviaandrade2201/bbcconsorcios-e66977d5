-- Elimina recursão infinita na policy de profiles substituindo a consulta
-- à própria tabela profiles por uma comparação direta com auth.uid().

-- 1. Adiciona coluna que armazena o user_id (auth.users) do consultor responsável.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consultor_user_id UUID;

-- 2. Preenche a nova coluna para registros existentes (a partir de consultor_id → profiles.user_id).
UPDATE public.profiles p
SET consultor_user_id = c.user_id
FROM public.profiles c
WHERE p.consultor_id = c.id
  AND p.consultor_user_id IS NULL;

-- 3. Atualiza a policy de consultores para não consultar profiles recursivamente.
DROP POLICY IF EXISTS "Consultores can manage own clients" ON public.profiles;
CREATE POLICY "Consultores can manage own clients"
ON public.profiles
FOR ALL
TO authenticated
USING (
  internal.has_role(auth.uid(), 'consultor'::app_role)
  AND consultor_user_id = auth.uid()
)
WITH CHECK (
  internal.has_role(auth.uid(), 'consultor'::app_role)
  AND consultor_user_id = auth.uid()
);

-- 4. Força o PostgREST a recarregar o schema cache para refletir a nova coluna/policies.
NOTIFY pgrst, 'reload schema';