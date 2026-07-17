
-- Grants para acesso via Data API
GRANT SELECT ON public.cartas TO authenticated;
GRANT SELECT ON public.carta_parcelas TO authenticated;
GRANT ALL ON public.cartas TO service_role;
GRANT ALL ON public.carta_parcelas TO service_role;

-- Policy: cliente titular pode ver suas próprias cartas
DROP POLICY IF EXISTS "Clientes read own cartas" ON public.cartas;
CREATE POLICY "Clientes read own cartas" ON public.cartas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = cartas.cliente_id AND p.user_id = auth.uid()
    )
  );
