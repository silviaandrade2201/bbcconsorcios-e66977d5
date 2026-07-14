
-- Fix infinite recursion in profiles policy caused by subquery on profiles.
CREATE OR REPLACE FUNCTION internal.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

DROP POLICY IF EXISTS "Consultores can manage own clients" ON public.profiles;
CREATE POLICY "Consultores can manage own clients"
ON public.profiles
FOR ALL
TO authenticated
USING (internal.has_role(auth.uid(), 'consultor'::app_role) AND consultor_id = internal.current_profile_id())
WITH CHECK (internal.has_role(auth.uid(), 'consultor'::app_role) AND consultor_id = internal.current_profile_id());
