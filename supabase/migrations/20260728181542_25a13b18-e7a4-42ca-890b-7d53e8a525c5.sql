GRANT SELECT ON public.app_config TO anon;
DROP POLICY IF EXISTS "public read config" ON public.app_config;
CREATE POLICY "public read config" ON public.app_config FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.app_config (key, value) VALUES
  ('whatsapp_numero', '"551140966528"'::jsonb),
  ('whatsapp_mensagem', '"Olá! Vim pelo site da BBC Consórcios e gostaria de tirar uma dúvida sobre consórcio."'::jsonb)
ON CONFLICT (key) DO NOTHING;