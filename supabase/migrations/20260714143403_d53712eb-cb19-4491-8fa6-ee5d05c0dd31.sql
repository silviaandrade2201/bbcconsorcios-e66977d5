-- 1. Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'consultor', 'cliente');

-- 2. Tabela de papéis por usuário
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de perfis
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    phone TEXT,
    whatsapp TEXT,
    email TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    notes TEXT,
    consultor_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Tabela de cartas contempladas
CREATE TABLE public.cartas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valor NUMERIC NOT NULL,
    administradora TEXT NOT NULL,
    grupo TEXT NOT NULL,
    cota TEXT NOT NULL,
    prazo INTEGER NOT NULL,
    parcela NUMERIC NOT NULL,
    situacao TEXT NOT NULL DEFAULT 'disponivel',
    valor_entrada NUMERIC NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cartas TO authenticated;
GRANT ALL ON public.cartas TO service_role;
GRANT SELECT ON public.cartas TO anon;

ALTER TABLE public.cartas ENABLE ROW LEVEL SECURITY;

-- 5. Gatilho para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cartas_updated_at
BEFORE UPDATE ON public.cartas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
