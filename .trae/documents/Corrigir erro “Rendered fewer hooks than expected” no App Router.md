## Resumo do problema

* O erro indica que algum componente cliente está chamando um número diferente de hooks entre renderizações, geralmente por causa de retornos antecipados ou hooks condicionais.

* A stack aponta para o limite do Next (`ClientSegmentRoot`), então o problema está em um componente dentro do segmento atual.

## Causas comuns

* Hooks dentro de `if`, loops, `try/catch`, ou operadores ternários.

* `return` antecipado antes dos primeiros hooks do componente.

* Uso de hooks em custom hooks de maneira condicional com base em props/estado.

## Onde investigar no projeto

* Componentes cliente em `src/components/**` e páginas em `src/app/**` que fazem retornos condicionais:

  * `src/components/ProtectedRoute.tsx` (retornos condicionais após hooks) — parece correto.

  * `src/components/staff/StaffLayoutClient.tsx` — parece correto.

  * `src/components/ui/ClientToastProvider.tsx` — retorna diferente antes de envolver em `ToastProvider`; vamos unificar a montagem do provider.

  * Páginas do App Router como `src/app/page.tsx` e seções de `src/app/admin/*`, `src/app/staff/*`, `src/app/customer/*`.

## Ações de verificação (sem mudanças de estado)

1. Ativar lint específico para hooks:

   * Adicionar `eslint-plugin-react-hooks` e as regras `react-hooks/rules-of-hooks` e `react-hooks/exhaustive-deps`.

   * Rodar lint para listar pontos com hooks fora da convenção.
2. Busca direcionada por padrões arriscados:

   * Procurar por `return` no início de funções de componente antes de qualquer `useState`/`useEffect`/etc.

   * Procurar por `&& useX`, `? useX : useY`, e `try { ... useX ... }` dentro de componentes.

## Correções planejadas

1. Padronizar ordem dos hooks nos componentes cliente:

   * Mover todos os hooks para o topo da função do componente, antes de qualquer `return` condicional.

   * Substituir lógica condicional por variáveis derivadas após os hooks, e usar essas variáveis no JSX (sem afetar a contagem de hooks).
2. Ajuste no `ClientToastProvider`:

   * Renderizar sempre `ToastProvider` e controlar apenas o conteúdo interno com `isMounted`, para evitar mudanças estruturais que possam mascarar problemas de hooks em árvores filhas:

   * Ex.: `return <ToastProvider>{isMounted ? children : children}</ToastProvider>` (Provider sempre montado; conteúdo não altera a contagem de hooks do próprio provider).
3. Limpeza de imports experimentais:

   * Remover `import { use } from 'react'` de `src/app/page.tsx` e similares (não usado e pode gerar confusão em builds).
4. Revisar custom hooks em `src/hooks/**` para garantir que eles mesmos não tenham hooks condicionais internos (rápida revisão mostra conformidade, manter a checagem com lint).

## Validação

* Rodar o projeto em desenvolvimento e navegar pelas rotas afetadas para confirmar que o erro não ocorre.

* Executar lint e garantir zero violações das regras de hooks.

## Entregáveis

* Atualização do ESLint com `react-hooks` e correções nos componentes identificados.

* Ajuste no `ClientToastProvider` e remoção de imports supérfluos.

* Relatório curto de arquivos alterados com referências de linha (ex.: `src/components/ui/ClientToastProvider.tsx:17–21`, `src/app/page.tsx:3`).

## Próximo passo

* Confirme para aplicar as correções e configurar o lint; em seguida realizo os ajustes e valido em execução.

