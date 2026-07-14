# Entrega única — Auth, Cadastros, Dados Reais e Área do Cliente

Cobre os pontos 9 a 17 do briefing. Executo tudo numa rodada só, conforme sua escolha.

## 1. Separação de perfis (ponto 9)
- Bloquear no **login do cliente** (`/login`) qualquer CPF cujo `user_roles.role` seja `admin` ou `consultor` → mensagem "Use a área administrativa".
- Bloquear no **login admin** (`/login-admin`) qualquer e-mail cuja role seja `cliente`.
- Guarda de rota: `AdminGate` exige role `admin`/`consultor`; `ClienteGate` exige role `cliente`. Se a role não bater, faz `signOut` na sessão errada e redireciona.
- Auditar `site-header.tsx` para nunca mostrar link admin a cliente/anônimo.

## 2. Dados 100% reais (ponto 10)
- Dashboard admin (`/admin`): trocar cards estáticos por `useQuery` que conta `profiles` (clientes/consultores), `cartas` disponíveis, valor total, últimos cadastros.
- Listas de clientes e usuários: já vêm do banco; remover qualquer array mock remanescente.
- Área do cliente (`/cliente`): substituir placeholder por dados do próprio `profiles` (nome, CPF mascarado, telefone, consultor responsável).

## 3. Atualização automática da UI (ponto 11)
- Padronizar todos os CRUDs com `useMutation` + `queryClient.invalidateQueries` das keys afetadas (`users`, `clients`, `cartas`, `me`).
- Remover `refetch()` manuais soltos; usar invalidação por key.

## 4. Mensagens de erro específicas (ponto 12)
- Helper `mapAuthError(err)` traduz códigos Supabase/Postgres para PT-BR: `CPF já cadastrado`, `E-mail já cadastrado`, `Senha inválida`, `Usuário não encontrado`, `Permissão insuficiente`, `Falha de comunicação com o banco`, `Registro não localizado`.
- Aplicar em: cadastro/edição de usuário, cadastro/edição de cliente, login cliente, login admin, troca de senha.
- `console.error` com o erro original em dev.

## 5. CPF real (ponto 13)
- `src/lib/cpf.ts`: `sanitizeCpf`, `isValidCpf` (algoritmo dos dígitos verificadores), `formatCpf`.
- No servidor (`createClient` / `updateClient`): validar CPF, gravar só dígitos, retornar erro `CPF inválido` ou `CPF já cadastrado` (checa `profiles.cpf` antes do insert).
- Migração: `UNIQUE` em `profiles.cpf` (após limpeza de duplicados/nulos) + índice.
- Login cliente: sanitiza CPF antes de resolver e-mail técnico.

## 6. Segurança de senhas (ponto 14)
- Nada muda no armazenamento: Supabase Auth já faz hash. Documentar no código.
- Login cliente continua via e-mail técnico sintético `cliente-<cpf>@clientes.bbc.local`, resolvido a partir do CPF; senha vai crua só para `signInWithPassword` (TLS).
- Bloquear senha < 6 no client e no server.

## 7. Cadastro transacional (ponto 15)
- `createClient` / `createUser` no server: se falhar `profiles.insert` OU `user_roles.insert`, chamar `supabaseAdmin.auth.admin.deleteUser` para reverter (já feito parcialmente; estender para roles).
- Envolver validações (CPF único, e-mail único) **antes** do `auth.admin.createUser` para não criar user órfão à toa.

## 8. Auditoria de integridade (ponto 16)
- Migração SQL que:
  - deleta `profiles` sem `user_id` válido em `auth.users`;
  - deleta `user_roles` órfãs;
  - remove duplicatas de CPF mantendo a mais antiga;
  - cria `UNIQUE(cpf)` e `UNIQUE(email)` em `profiles`;
  - garante que todo `auth.users` com role `cliente` tenha `profiles` (backfill).

## 9. Área do Cliente — Meus dados (escopo desta rodada)
- `/cliente` mostra card com dados atuais.
- `/cliente/perfil`: formulário editável (nome, telefone, whatsapp) → `updateMyProfile` server fn.
- `/cliente/senha`: formulário troca de senha usando `clienteSupabase.auth.updateUser({ password })`.
- Toast de sucesso/erro com mensagens específicas.

## 10. Verificação (ponto 17)
- Rodar `tsgo --noEmit`.
- Testar via Playwright headless:
  1. Login admin → cria consultor → cria cliente → aparecem nas listas e no dashboard.
  2. Login cliente com CPF → cai em `/cliente`, edita perfil, troca senha, faz logout.
  3. Tentar CPF duplicado → erro específico.
  4. Tentar login cliente com credenciais admin → erro específico.

---

## Detalhes técnicos

**Novos arquivos**
- `src/lib/cpf.ts` — validação/format.
- `src/lib/error-messages.ts` — `mapError(err) → string`.
- `src/lib/client-profile.functions.ts` — `getMyProfile`, `updateMyProfile` (com `requireSupabaseAuth`).
- `src/routes/_authenticated/cliente/perfil.tsx`, `.../cliente/senha.tsx`.

**Migração SQL** (uma única)
1. Backfill/cleanup de duplicatas.
2. `ALTER TABLE profiles ADD CONSTRAINT profiles_cpf_key UNIQUE (cpf) NULLS NOT DISTINCT` — na verdade Postgres 15+ suporta; se não, usar índice único parcial `WHERE cpf IS NOT NULL`.
3. Índice em `profiles.email`.

**Alterações principais**
- `src/lib/admin.functions.ts` — validação CPF, checagem de duplicado, mapeamento de erro, rollback role.
- `src/routes/login.tsx` — bloqueia role != cliente, mensagens específicas.
- `src/routes/login-admin.tsx` — bloqueia role cliente.
- `src/routes/_authenticated/admin/route.tsx` — reforça role admin/consultor.
- `src/routes/_authenticated/admin/index.tsx` — dashboard com contagens reais.
- `src/routes/_authenticated/admin/clientes.tsx` e `usuarios.tsx` — usar `useMutation`+invalidate, mensagens específicas.
- `src/routes/_authenticated/cliente/*` — nova área "Meus dados".

**Sem mudanças**
- Storage/bucket de documentos (fora do escopo desta rodada).
- Vínculo cliente↔carta (fora do escopo).
- Consórcios/simulador/site público continuam iguais.

Aprovar para eu executar.
