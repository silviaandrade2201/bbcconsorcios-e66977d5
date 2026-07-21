UPDATE public.cartas
SET data_contemplacao = (
  primeiro_vencimento
  + ((parcelas_totais - 1) || ' months')::interval
  + '7 days'::interval
)::date
WHERE primeiro_vencimento IS NOT NULL
  AND parcelas_totais IS NOT NULL
  AND parcelas_totais > 0;