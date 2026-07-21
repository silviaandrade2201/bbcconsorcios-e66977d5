ALTER TABLE public.cartas
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS bem_especifico text;