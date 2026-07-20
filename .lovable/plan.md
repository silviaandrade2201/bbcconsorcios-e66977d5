
## Objetivo
1. Transformar a página "Meus Dados" do cliente em um cadastro completo estilo bancário, com upload de documentos.
2. Garantir que a sessão do cliente seja realmente independente do painel administrativo e não persista quando a aba/navegador for fechado.

---

## 1. Meus Dados (Área do Cliente)

### Banco de Dados (migração)
Adicionar colunas em `public.profiles`:
- Dados pessoais: `rg`, `birth_date`, `marital_status`, `profession`
- Contato: `email` (já existe via auth), reforçar `phone`, `whatsapp`
- Endereço: `cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `country` (default 'Brasil')
- Documentos: `rg_doc_url`, `cnh_doc_url`, `address_proof_url`

Criar bucket de Storage `client-documents` (privado) com policies:
- Cliente só pode ler/escrever arquivos dentro de pasta com seu próprio `auth.uid()`
- Admin/consultor pode ler tudo

### Edge Function `bbc-api`
Atualizar handlers:
- `getMyProfile` → devolve todos os novos campos + URLs assinadas dos documentos
- `updateMyProfile` → aceita todos os novos campos com validação
- Novo: `getDocumentUploadUrl` → gera signed upload URL para o arquivo do cliente
- Novo: `deleteMyDocument` → remove um documento

### UI — `src/routes/_authenticated/cliente/perfil.tsx`
Reconstruir com layout moderno em abas ou cards seccionados:
- **Dados Pessoais**: Nome, CPF (readonly), RG, Nascimento, Estado civil, Profissão
- **Contato**: Email (readonly do auth), Celular, WhatsApp
- **Endereço**: CEP (com busca ViaCEP), Rua, Número, Complemento, Bairro, Cidade, Estado, País
- **Documentos**: Upload RG, CNH, Comprovante de Residência (com preview/substituir/remover)
- **Segurança**: Link/seção para alteração de senha (reaproveitar `/cliente/senha`)

Componentes: `Tabs` do shadcn, `Input`, `Select` para UF/estado civil, `Card` por seção, máscaras de CPF/CEP/telefone.

---

## 2. Sessão Independente e Segura do Cliente

### Problema atual
- `clienteSupabase` usa `localStorage` com `persistSession: true` → sessão sobrevive ao fechar aba, sem expiração real.
- Compartilha comportamento de persistência com o admin.

### Solução em `src/lib/dual-supabase.ts`
- Cliente (`clienteSupabase`): usar `sessionStorage` em vez de `localStorage` → sessão morre ao fechar a aba/navegador.
- Admin (`adminSupabase`): mantém `localStorage` (comportamento atual do painel).
- Manter `storageKey` distinto para não colidir.

### Fluxo de logout e expiração
- Garantir `signOut` no `cliente-header` limpe também `sessionStorage`.
- Adicionar listener em `ClienteAuthProvider`: no evento `TOKEN_REFRESHED` falho ou `SIGNED_OUT`, redirecionar para `/login`.
- Adicionar verificação de idle timeout (ex.: 30 min sem interação → logout automático) via hook simples de `visibilitychange` + timer.

---

## Detalhes técnicos

- Storage: bucket privado, RLS por `(storage.foldername(name))[1] = auth.uid()::text`.
- ViaCEP: fetch client-side `https://viacep.com.br/ws/{cep}/json/` para autopreencher endereço.
- Migração incremental: `ALTER TABLE ADD COLUMN IF NOT EXISTS ...` para não quebrar dados existentes.
- Grants em `profiles` já existem; nada a alterar.

---

## Entrega
1. Migração SQL (colunas + bucket + policies).
2. Atualização da edge function `bbc-api` com novos actions.
3. Nova página `perfil.tsx` seccionada + componentes auxiliares.
4. `dual-supabase.ts` com `sessionStorage` para cliente + idle timeout.
