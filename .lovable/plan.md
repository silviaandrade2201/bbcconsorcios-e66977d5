Plano de implementação do painel administrativo da BBC Consórcios.

## Escopo

Criar um painel administrativo completo para gerenciamento de usuários (administradores), consultores e clientes, mantendo a identidade visual e o layout atual do site.

## Estrutura do banco de dados

1. Roles e permissões
   - Criar enum `app_role` com valores: `admin`, `consultor`, `cliente`.
   - Criar tabela `public.user_roles` (`id`, `user_id`, `role`, `created_at`).
   - Criar função `public.has_role(user_id, role)` como security definer.
   - Aplicar GRANTs e RLS.

2. Tabela de perfis
   - Criar `public.profiles` (`id`, `user_id`, `name`, `cpf`, `phone`, `whatsapp`, `email`, `address`, `city`, `state`, `status`, `notes`, `consultor_id`, `created_at`, `updated_at`).
   - Status: `ativo`, `inativo`, `pendente`.
   - Vincular consultor responsável via `consultor_id`.
   - Aplicar GRANTs e RLS.

3. Tabela de cartas contempladas
   - Criar `public.cartas` (`id`, `valor`, `administradora`, `grupo`, `cota`, `prazo`, `parcela`, `situacao`, `valor_entrada`, `descricao`, `created_at`, `updated_at`).
   - Situações: `disponivel`, `reservada`, `vendida`, `contemplada`.
   - Aplicar GRANTs e RLS.

## Autenticação e níveis de acesso

1. Manter login por e-mail/senha (padrão Lovable Cloud) + Google OAuth.
2. Adicionar campo de papel ao cadastro e edição.
3. Clientes logam com CPF + senha.
4. Proteger rotas administrativas e de cliente.

## Rotas do painel

1. `/admin/dashboard`
   - Total de clientes, consultores, cartas disponíveis, contempladas, vendidas, novos cadastros e histórico de atividades.

2. `/admin/usuarios`
   - Lista de administradores e consultores.
   - Ações: cadastrar, editar, ativar/desativar, alterar senha, definir permissões.

3. `/admin/clientes`
   - Lista completa de clientes.
   - Ações: cadastrar, editar, excluir, pesquisar, visualizar detalhes.
   - Filtros por status e consultor responsável.

4. `/admin/cartas`
   - Gerenciamento de cartas contempladas.
   - Ações: cadastrar, editar, excluir, alterar situação.

5. `/admin/depoimentos`
   - CRUD dos depoimentos exibidos no site.

## Área do cliente

1. `/cliente/login` — CPF + senha.
2. `/cliente/area`
   - Dados pessoais.
   - Cartas adquiridas.
   - Cartas contempladas.
   - Propostas disponíveis.
   - Documentos (download).
   - Contratos.
   - Histórico.

## Componentes de UI

1. Layout do painel: sidebar fixa à esquerda, header com perfil do usuário, conteúdo principal.
2. Tabelas com busca, paginação e filtros.
3. Modais de criação/edição.
4. Cards de resumo para o dashboard.
5. Manter cores, fontes e animações atuais.

## Tarefas de implementação

1. Configurar schema no banco de dados (migrações).
2. Criar server functions para operações de admin, consultor e cliente.
3. Criar rotas protegidas sob `_authenticated/` e `admin/`.
4. Criar componentes de layout e tabelas do painel.
5. Criar formulários de cadastro/edição.
6. Criar área do cliente.
7. Adicionar histórico de atividades e dashboard.
8. Testar permissões e fluxos de autenticação.

## Entrega sugerida

Implementar em fases:
- Fase 1: schema e autenticação/roles.
- Fase 2: dashboard e gerenciamento de usuários/consultores.
- Fase 3: clientes e cartas contempladas.
- Fase 4: área do cliente e documentos.
