-- 1. Função para verificar papel (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

-- 2. Políticas para user_roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Políticas para profiles
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultores can manage own clients"
ON public.profiles
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'consultor')
    AND consultor_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
    public.has_role(auth.uid(), 'consultor')
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

-- 4. Políticas para cartas
CREATE POLICY "Admins can manage cartas"
ON public.cartas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultores can manage cartas"
ON public.cartas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'consultor'))
WITH CHECK (public.has_role(auth.uid(), 'consultor'));

CREATE POLICY "Public can view available cartas"
ON public.cartas
FOR SELECT
TO anon, authenticated
USING (situacao = 'disponivel');
