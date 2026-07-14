-- 1. Remover políticas antigas que dependem da função antiga
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Consultores can manage own clients" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage cartas" ON public.cartas;
DROP POLICY IF EXISTS "Consultores can manage cartas" ON public.cartas;
DROP POLICY IF EXISTS "Public can view available cartas" ON public.cartas;

-- 2. Remover função antiga
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);

-- 3. Criar schema interno e função nova
CREATE SCHEMA IF NOT EXISTS internal;

CREATE OR REPLACE FUNCTION internal.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = internal, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

GRANT USAGE ON SCHEMA internal TO authenticated;
GRANT EXECUTE ON FUNCTION internal.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION internal.has_role(UUID, public.app_role) TO service_role;

-- 4. Recriar políticas usando internal.has_role
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (internal.has_role(auth.uid(), 'admin'))
WITH CHECK (internal.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (internal.has_role(auth.uid(), 'admin'))
WITH CHECK (internal.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultores can manage own clients"
ON public.profiles
FOR ALL
TO authenticated
USING (
    internal.has_role(auth.uid(), 'consultor')
    AND consultor_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
    internal.has_role(auth.uid(), 'consultor')
    AND consultor_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage cartas"
ON public.cartas
FOR ALL
TO authenticated
USING (internal.has_role(auth.uid(), 'admin'))
WITH CHECK (internal.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultores can manage cartas"
ON public.cartas
FOR ALL
TO authenticated
USING (internal.has_role(auth.uid(), 'consultor'))
WITH CHECK (internal.has_role(auth.uid(), 'consultor'));

CREATE POLICY "Public can view available cartas"
ON public.cartas
FOR SELECT
TO anon, authenticated
USING (situacao = 'disponivel');
