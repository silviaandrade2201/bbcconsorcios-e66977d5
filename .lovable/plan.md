## Cartas — ajustes solicitados

### 1. Aba Cartas totalmente funcional em tempo real
- Auditar `listCartas`, `getCarta`, `upsertCarta`, `toggleParcelaPaga`, `listPaymentHistory` e garantir que toda mutação invalide as queries relevantes (`["cartas"]`, `["carta", id]`, `["payment-history", id]`) — hoje o diálogo de detalhes não invalida após marcar parcelas pagas em massa.
- Adicionar `refetchOnWindowFocus: true` nas queries de cartas/parcelas para refletir mudanças feitas em outra aba/usuário.
- Corrigir loading states e mensagens de erro do diálogo de detalhes usando `mapError`.

### 2. Histórico usa vencimento + horário aleatório do dia
- Em `toggleParcelaPaga` (`src/lib/cartas.functions.ts`), quando `pago = true`, calcular `paymentDateTime` = `vencimento` + hora/minuto/segundo aleatórios (08:00–20:00). Persistir esse valor em `carta_parcelas.pago_em` e em `payment_history.payment_date` / `created_at` (via `notes` fica claro que é a data de referência).
- Nunca gravar `new Date()` como momento do pagamento — só como `updated_by`/rastro interno se necessário.
- Mesma regra aplicada ao novo botão "marcar todas como pagas".

### 3. Botão "Marcar todas as parcelas como pagas"
- Nova server function `markAllParcelasPagas({ carta_id })` em `cartas.functions.ts`:
  - Busca todas as parcelas pendentes/atraso da carta.
  - Para cada uma, define `pago_em` = vencimento + horário aleatório (mesma regra do item 2), status = `pago`, `pago_por = userId`.
  - Insere um `payment_history` por parcela (event_type `pagamento_registrado`, `payment_date` = mesma data calculada).
  - Atualiza `cartas.parcelas_pagas`.
- Novo botão no `CartaDetalheDialog` (aba Parcelas), com `AlertDialog` de confirmação, invalidando `["carta", id]` e `["payment-history", id]` no sucesso.

### 4. Cartas do cliente aparecem no login
- Nova server function pública para o cliente autenticado: `listMinhasCartas` em `src/lib/client-profile.functions.ts` (usa `requireSupabaseAuth`, filtra `cartas.cliente_id = context.userId` via `context.supabase`).
- Ajustar policy/RLS de `cartas` e `carta_parcelas` para permitir `SELECT` ao próprio cliente titular (`auth.uid() = cliente_id` em `cartas`; em `carta_parcelas` via `EXISTS` na carta do titular). GRANT SELECT para `authenticated`.
- Em `src/routes/_authenticated/cliente/index.tsx`, abaixo dos cartões de dados, renderizar seção "Minhas cartas" listando cada carta do cliente: administradora, grupo/cota, valor do bem, parcela, progresso (`parcelas_pagas/parcelas_totais`), próxima parcela em aberto e situação. Estado vazio amigável quando não houver cartas.

### Detalhes técnicos
- Horário aleatório: `hour ∈ [8,19]`, `min/sec ∈ [0,59]`; combinado com `vencimento` no fuso local (`YYYY-MM-DDTHH:mm:ss`).
- `payment_history` continua imutável (trigger existente). Só adicionamos linhas.
- Nenhuma alteração no cálculo financeiro nem no fluxo de criação de carta.
- Sem mudanças em rotas públicas ou no admin fora do módulo Cartas.
