# Arquitetura e Guia de Pastas — Projeto Lanchonete (explicado para iniciantes)

Este documento explica de forma comentada as principais pastas do frontend do projeto (Next.js, app router). O objetivo é mostrar para que cada pasta serve, quais responsabilidades carregar, como os arquivos se conectam e boas práticas para quem está começando.

Observação: o projeto usa Next.js (app directory), TypeScript e Prisma no backend. Aqui focamos nas pastas frontend encontradas em `src/`.

---

## Visão geral rápida

- `components/` — UI e componentes reutilizáveis (botões, cards, modais, blocos por domínio).
- `config/` — configurações compartilhadas (ex.: realDataConfig, feature flags, endpoints locais).
- `hooks/` — hooks React customizados (ferramentas para consumir APIs, estado compartilhado, lógica reutilizável).
- `lib/` — bibliotecas utilitárias do app (autenticação, formatação, cliente Prisma em server, helpers puros).
- `stores/` — pequenos stores (ex.: Zustand, useState global) para estados que precisam ser acessados de várias partes.
- `types/` — tipos TypeScript e interfaces usadas por todo o projeto.

Essas pastas colaboram: componentes consomem hooks; hooks usam `lib` para utilitários; `types` descreve os dados; `stores` mantém estados compartilhados; `config` centraliza parâmetros.

---

## `components/` — O que vai aqui

Propósito
- Guardar componentes que podem ser reutilizados em várias páginas (UI primitives) e componentes específicos por domínio (admin, customer, staff).

Exemplos no projeto
- `components/ui/*` — botões, badges, modal, toast, Skeleton, etc. São "blocos" puros de UI.
- `components/admin/*` — componentes voltados ao painel admin (sidebar, header, forms, modals).
- Componentes específicos como `ProductCard`, `TableCard`, `ProtectedRoute`.

Boas práticas
- Componentes puros (presentational) não devem lidar com fetch direto — preferível receber dados via props ou hooks.
- Separar componentes de layout (ex.: `AdminSidebar`) de componentes funcionais (ex.: `OrderDetailsModal`).
- Nomear arquivos com PascalCase: `MyComponent.tsx`.

Como eles se ligam
- Uma página (em `src/app/...`) importa componentes para montar a UI. Ex.: `src/app/admin/orders/page.tsx` importa `OrderDetailsModal` e `AdminHeader`.

---

## `config/` — central de configurações

Propósito
- Armazenar constantes e objetos de configuração que mudam pouco: URLs de serviços, mapeamentos, feature flags e configurações do "real data".

Exemplo no projeto
- `config/realDataConfig.ts` — configurações que definem se o app está em modo real-time, endpoints WS, etc.

Boas práticas
- Não colocar segredos no repositório (use env vars ou `env.example`).
- Manter apenas valores que façam sentido compartilhar entre módulos.

Como se conecta
- Hooks e libs importam `config/*` para decidir comportamento (p.ex., `useRealData` em `hooks/` pode ler `realDataConfig`).

---

## `hooks/` — lógica reutilizável do React

Propósito
- Encapsular lógica: chamadas a APIs, gerenciamento de formulários, debounce de inputs, lógica de autenticação e integração com stores.

Hooks importantes no projeto
- `useApi.ts` — hook genérico para fazer GETs com gerenciamento de loading/error, abort controller e deduplicação.
  - Entrada: `url: string, options`.
  - Saída: `{ data, loading, error, execute, reset }`.
  - Observação: foi ampliado para deduplicar requisições em voo e evitar chamadas duplicadas (útil no dev com React Strict Mode).
- `useApiAuth.ts` — fornece token / usuário autenticado (integra com `stores/authStore.ts`).
- `useCart.ts` / `useCartReducer` — lógica de carrinho (adicionar/remover itens, total, persistência).
- `useOptimizedMenu.ts` / `useOptimizedAuth.ts` — wrappers para otimizar consultas e cache.

Boas práticas
- Hooks customizados devem começar com `use` e serem pequenos (uma responsabilidade clara).
- Evitar efeitos colaterais escondidos em componentes; coloque-os em hooks para reutilização e teste.

Como se conectam
- Componentes chamam hooks para obter dados/ações. Ex.: `TablePage` usa `useApi` para buscar pedidos e `useApiAuth` para pegar o usuário.
- Hooks podem usar `lib/` para utilitários (ex.: converter datas) ou `stores/` para gravar estado global.

---

## `lib/` — utilitários e adaptadores

Propósito
- Contém funções utilitárias puras e adaptadores (ex.: cliente Prisma para servidor, funções de autenticação, formatação, notificações).

Exemplos
- `lib/prisma.ts` — exporta instância do Prisma para rotas servidor.
- `lib/auth.ts` — helpers para verificar token, permissões.
- `lib/utils.ts` — formatação de moeda, datas, helpers puros.
- `lib/notificationService.ts` — lógica para enviar notificações internas (pode ligar com WebSocket, push ou gravação no banco).

Boas práticas
- `lib` não deve depender de React. Mantê-lo testável e sem side effects globalmente inesperados.
- Separar funções puras de adaptadores que tocam infra (DB, rede).

Como se conectam
- API routes (server) importam `lib/prisma` e `lib/auth`.
- Hooks e componentes importam utilitários puros de `lib/utils`.

---

## `stores/` — estado global leve

Propósito
- Guardar estados que precisam ser lidos/escritos por múltiplos componentes (ex.: auth, carrinho, preferências). Implementado com Zustand ou outro micro-store.

Exemplo no projeto
- `stores/authStore.ts` — guarda token, usuário e funções para login/logout.

Boas práticas
- Preferir stores para estado que realmente precisa ser global. Não transformar tudo em store.
- Manter a API do store simples: getters/setters e ações.

Como se conectam
- `useApiAuth` pode usar `stores/authStore` para obter token. Componentes acessam o store para exibir nome do usuário, etc.

---

## `types/` — modelo do domínio e contratos TypeScript

Propósito
- Centralizar interfaces e tipos (Order, User, Product, Table, CartItem etc.). Ajuda a evitar `any` e facilita navegação e refatoração.

Exemplo
- `src/types/index.ts` contém `Order`, `OrderStatus`, `UserRole`, `Product`, `Table` etc.

Boas práticas
- Preferir tipos explícitos para inputs/outputs de API e props de componentes.
- Usar enums (ou `as const`) para status fixos (p.ex., `OrderStatus = 'CONFIRMADO' | 'PREPARANDO' | 'PRONTO' ...`).

Como se conectam
- Hooks retornam dados tipados com os tipos de `types`.
- Componentes recebem props fortemente tipadas.
- API routes usam tipos para validar/transformar dados antes de salvar no DB.

---

## Fluxo típico de dados (exemplo: página Admin Orders)

1. Página `src/app/admin/orders/page.tsx` monta e chama um hook: `const { data, loading } = useApi('/api/admin/orders')`.
2. `useApi` constrói a requisição, lê token via `useApiAuth` (que usa `stores/authStore`) e executa `fetch`.
3. `fetch` retorna JSON; `useApi` atualiza seu estado interno e chama `onSuccess` se houver.
4. A página recebe `data` e passa pedaços para componentes UI (ex.: `OrderCard`, `Pagination`).
5. Ações do usuário (ex.: clicar "Marcar como pronto") usam `useApiMutation('/api/admin/orders')` para enviar um PUT; em sucesso, chamam `refetch` ou `execute()` novamente para atualizar a lista.
6. Se necessário, `lib/notificationService` é usado no backend para enviar notificações, e o frontend pode escutar via WebSocket (hook `useWebSocket` em `hooks/`).

---

## Diferença Server vs Client neste repositório (Next.js app dir)

- Arquivos em `src/app` podem ser Server Components por padrão. Quando há `"use client"` no topo do arquivo (ex.: `src/app/tables/[id]/page.tsx`), o componente roda no cliente React.
- Coloque lógica que precisa rodar no cliente (event handlers, modais, acesso a localStorage) em componentes/client hooks.
- Buscas que podem ser feitas no servidor (data estática/SSG ou SSR) podem ser movidas para Server Components ou API routes para evitar duplicação de fetch no cliente.

Dica: Prefira fazer o primeiro fetch no Server Component quando possível — assim o HTML já vem com dados e o cliente não dispara fetch adicional ao montar.

---

## Dicas práticas para iniciantes e armadilhas comuns

- Duplicate fetches: em dev com React Strict Mode, o `useEffect` pode rodar duas vezes. Nosso `useApi` já tem dedupe/in-flight para mitigar, mas sempre verificar `immediate` e `useEffect` deps.
- Evitar lógica pesada no render: colocá-la em hooks ou em funções utilitárias em `lib`.
- Mantenha `components/ui` puros (apenas apresentação). Logica vão para `hooks`.
- Teste API routes com Postman / Insomnia e use logs (`console.time`) para medir latência.
- Use `types` para documentar contratos de API — isso evita bugs sutis.

---

## Como estender (exemplos rápidos)

Adicionar um novo hook `useFoo`:
1. Criar `src/hooks/useFoo.ts`.
2. Injetar dependências: se precisa de token, use `useApiAuth`; se precisa de cache, use `useApi` ou `useApiMutation`.
3. Exportar funções fáceis de usar: `const { data, loading, doFoo } = useFoo();`.

Adicionar componente UI
1. Criar `src/components/ui/MyWidget.tsx`.
2. Receber dados via props: `({ title, onClick }: { title: string; onClick: () => void })`.
3. Usar dentro de uma página: `import MyWidget from '@/components/ui/MyWidget'`.

---

## Comandos úteis

Roda o dev server e veja logs:

```powershell
npm run dev
```

Rodar testes unitários (vitest):

```powershell
npm run test:unit
```

---

## Links de leitura rápida (para novos em Next.js)

- Next.js App Router (oficial): https://nextjs.org/docs/app
- React Hooks (oficial): https://reactjs.org/docs/hooks-intro.html
- TypeScript Handbook (Basic Types): https://www.typescriptlang.org/docs/

---

Se quiser, eu posso:
- Gerar um diagrama simples (em ASCII ou imagem) mostrando dependências entre `components`, `hooks`, `lib`, `stores`.
- Fazer um PR com exemplos de um novo hook e um novo componente seguindo esta arquitetura.

Se preferir, diga qual parte quer que eu documente com mais detalhes (ex.: exemplos de código do `useApi`, fluxos de autenticação ou rotas admin).