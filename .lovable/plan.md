## Objetivo
Fazer com que o card flutuante de depoimentos (TestimonialToast) apareça apenas na homepage (`/`), não nas áreas autenticadas de admin (`/admin/*`) e cliente (`/cliente/*`).

## Alterações
1. **Remover `<TestimonialToast />` do layout raiz**  
   Arquivo: `src/routes/__root.tsx`  
   - Retirar o componente do `RootComponent`, deixando-o disponível apenas onde for explicitamente chamado.

2. **Adicionar `<TestimonialToast />` na homepage**  
   Arquivo: `src/routes/index.tsx`  
   - Inserir o componente ao final do conteúdo da página inicial, mantendo o mesmo comportamento de fade/ciclo aleatório.

3. **Verificação**  
   - Confirmar que `src/routes/__root.tsx` ainda exporta corretamente o layout sem o toast.
   - Garantir que `src/routes/index.tsx` importa o componente.
   - Rodar `tsgo --noEmit` para validar tipos.

## Resultado esperado
O depoimento flutuante some das rotas `/admin/*` e `/cliente/*` e continua visível apenas em `/`.
