
CREATE OR REPLACE FUNCTION public.block_history_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Histórico financeiro não pode ser excluído.'; END $$;
