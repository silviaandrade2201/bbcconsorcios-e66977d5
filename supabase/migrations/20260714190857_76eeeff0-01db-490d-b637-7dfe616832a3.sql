
-- 1. Cleanup orphan profiles/roles
DELETE FROM public.user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ur.user_id);

DELETE FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id);

-- 2. Normalize CPFs (keep only digits)
UPDATE public.profiles SET cpf = regexp_replace(cpf, '\D', '', 'g')
WHERE cpf IS NOT NULL AND cpf <> regexp_replace(cpf, '\D', '', 'g');

UPDATE public.profiles SET cpf = NULL WHERE cpf IS NOT NULL AND length(cpf) <> 11;

-- 3. Remove duplicate CPFs keeping earliest
WITH ranked AS (
  SELECT id, cpf, row_number() OVER (PARTITION BY cpf ORDER BY created_at ASC) AS rn
  FROM public.profiles WHERE cpf IS NOT NULL
)
UPDATE public.profiles p SET cpf = NULL
FROM ranked r WHERE p.id = r.id AND r.rn > 1;

-- 4. Unique indexes (partial to allow NULL)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_key ON public.profiles(cpf) WHERE cpf IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
