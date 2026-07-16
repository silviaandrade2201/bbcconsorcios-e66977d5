## Objetivo
Reformular o módulo Cartas com automação total: cadastro mínimo, cálculos automáticos, geração de parcelas, histórico auditável e dashboard financeiro em tempo real.

## 1. Banco de dados (migração)

**Novos campos em `cartas`:**
- `percentual_administrativo` numeric (default 12.00)
- `valor_administrativo` numeric
- `valor_total` numeric
- `primeiro_vencimento` date

**Nova tabela `payment_history`:**
- `id`, `carta_id` (FK), `installment_number`, `due_date`, `amount`, `status`, `payment_date`, `notes`, `event_type` (created|paid|unpaid|regenerated|updated|deleted), `created_by`, `updated_by`, `created_at`, `updated_at`
- RLS: admin/consultor podem ler/inserir; cliente só lê do próprio.
- GRANTs para authenticated + service_role.

**Nova tabela `carta_modelos`** (para modelos de carta persistidos):
- `id`, `nome`, `valor_bem`, `parcelas_totais`, `percentual_administrativo`, `descricao`, `created_by`, timestamps
- RLS admin/consultor.

**Configuração global:** tabela `app_config` com `key/value` para armazenar percentual administrativo padrão.

**Segurança:**
- Trigger que impede UPDATE/DELETE de parcelas com `status = 'pago'` (exceto pelo próprio serviço registrando estorno explícito).
- Trigger que impede DELETE em `payment_history`.

## 2. Server functions (`src/lib/cartas.functions.ts`)

Reescrever com:

- `calcularCarta({ valor_bem, parcelas_totais, percentual_administrativo })` → devolve valor_admin, valor_total, valor_parcela, ajuste da última parcela para bater o total exato.
- `calcularPrimeiroVencimento(data_adesao)` → regra do dia 10 (antes do 10 → mesmo mês; a partir do 10 → mês seguinte).
- `upsertCarta` recebe apenas: `cliente_id`, `valor_bem`, `parcelas_totais`, `data_adesao`, `percentual_administrativo?`, `administradora`, `grupo`, `cota`. Gera automaticamente todo o resto, cria as parcelas em transação e registra no `payment_history`.
- Reprocessamento: se `valor_bem`, `parcelas_totais`, `percentual_administrativo` ou `data_adesao` mudarem, recalcula, preserva parcelas pagas, regera as futuras, registra no histórico.
- `toggleParcelaPaga` → registra `payment_date`, `updated_by`, grava evento em `payment_history`, bloqueia alteração de valor de parcela paga.
- `getCartaDashboard(id)` → retorna dados + indicadores calculados (total pago, aberto, atraso, %quitado, contagens por status) atualizando status "em atraso" on-read.
- `listPaymentHistory(carta_id)` → linha do tempo cronológica.
- CRUD de `carta_modelos` (`listModelos`, `saveModelo`, `deleteModelo`).
- `getConfig`/`setConfig` para percentual administrativo padrão.

## 3. UI — `/admin/cartas`

Reescrever a página:

- **Aba Cartas**: listagem com busca/filtros. Formulário simplificado (Cliente, Valor do Bem, Parcelas, Data de Adesão, %Admin com default da config). Mostra preview automático de: valor administrativo, valor total, valor da parcela, primeiro vencimento.
- **Aba Modelos**: CRUD real dos modelos (usar server fn, invalidar query). Botão "Aplicar modelo" preenche o form.
- **Aba Configurações**: editar percentual administrativo padrão.
- **Detalhe da carta** (dialog ou rota): três abas
  - *Dashboard*: cards com todos os indicadores em tempo real.
  - *Parcelas*: tabela com status calculado (Pago/Pendente/Em atraso), botão marcar pago (bloqueado se já pago), sem editar valor.
  - *Histórico Financeiro*: timeline com todos os eventos, usuário, data/hora.

## 4. Regras de status

Calcular status derivado em cada leitura:
- `pago` se `payment_date` existir
- `atraso` se `due_date < hoje` e não pago
- `pendente` caso contrário

Persistir `status` mas recalcular ao abrir a carta e atualizar em lote as parcelas que passaram para atraso.

## 5. Auditoria/Segurança

- Todas operações mutantes em transação (RPC/PLpgSQL quando envolver múltiplas tabelas).
- Verificar role (`admin`/`consultor`) via `checkStaff` já existente.
- Nunca aceitar alteração de valor em parcela paga (bloqueio no server + trigger).
- Nada em localStorage; toda persistência via server functions → Supabase.

## Detalhes técnicos

- Arredondamento em centavos: `Math.round(x * 100) / 100`. Diferença acumulada vai para a última parcela.
- Regra do próximo dia 10: usar `date-fns` ou aritmética direta de `Date` (UTC noon para evitar timezone).
- Migração PL/pgSQL usa `SECURITY DEFINER` para funções que gravam histórico.
- Query keys React Query: `["cartas"]`, `["carta", id]`, `["carta-modelos"]`, `["app-config"]`, `["payment-history", id]` — invalidar após cada mutação.

## Fora de escopo (não solicitado)
- Notificações por e-mail/WhatsApp de vencimento.
- Estorno de pagamento (só marcar/desmarcar via server fn com registro no histórico).
- Área do cliente ainda não exibirá o novo dashboard (apenas admin/consultor).
