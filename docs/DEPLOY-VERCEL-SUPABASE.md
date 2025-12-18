# Plano de Deploy — Vercel + Supabase (Postgres)

Este guia detalha um deploy estável do projeto na Vercel usando banco de dados Supabase (Postgres), com configurações de ambiente, políticas de segurança (públicas e privadas), pooling de conexões e checklist completo de validação.

## Visão Geral
- Framework: Next.js (App Router), TypeScript
- Backend: Rotas server-side (runtime `nodejs`), Prisma ORM
- Banco: Supabase Postgres (com conexão direta para Prisma)
- Auth: JWT customizado do projeto (cookies) — não usa Supabase Auth
- Storage: Supabase Storage (opcional) para imagens públicas
- Deploy: Vercel (prod), Vercel Preview para PRs, ambiente Staging opcional

## Pré-requisitos
- Conta na Vercel e GitHub com repositório conectado
- Conta na Supabase e um projeto criado
- Variáveis de ambiente definidas (local, staging e prod)

## Supabase — Configuração do Banco
1. Criar projeto Supabase
   - Localize `Project Settings → Database` para obter a `connection string` (Postgres).
   - Anote:
     - Host (ex.: `db.<hash>.supabase.co`)
     - Porta normal: `5432`, pooling: `6543`
     - Banco: `postgres`
     - Usuário: `postgres`
     - Senha: definida ao criar projeto

2. Conexão com Pooling (recomendado para Serverless)
   - Use a porta de pooling `6543` para evitar excesso de conexões.
   - `DATABASE_URL` com SSL e pooling:
     - `postgresql://postgres:<SENHA>@db.<hash>.supabase.co:6543/postgres?sslmode=require`

3. Aplicar schema via Prisma Migrations
   - Em desenvolvimento: configure `DATABASE_URL` local apontando para Supabase e rode:
     - `npx prisma migrate deploy`
   - Ou aplique migrations via Supabase SQL Editor (copiando os `*.sql` gerados em `prisma/migrations`).
   - Recomenda-se aplicar as migrations antes do primeiro deploy (Vercel não roda migrations automaticamente).

4. Storage (opcional)
   - Crie bucket `public` para imagens de produtos.
   - Política: leitura pública; escrita restrita a admin/manager.

## Políticas de Segurança (RLS) — Supabase
Observação: o app usa Prisma com conexão direta (usuário `postgres`), o que não passa pelo PostgREST do Supabase. As políticas RLS controlam acesso quando usar o cliente Supabase (JS) ou REST. Ainda assim, é útil definir regras para proteger dados em acessos externos.

1. Habilitar RLS nas tabelas sensíveis
   - `orders`, `order_items`, `tables`, `users`
   - Deixar tabelas públicas de catálogo com leitura pública: `products`, `categories`, `adicionais`

2. Tabelas públicas (leitura)
```sql
alter table products enable row level security;
create policy "read products" on products for select using (true);

alter table categories enable row level security;
create policy "read categories" on categories for select using (true);

alter table adicionais enable row level security;
create policy "read adicionais" on adicionais for select using (true);
```

3. Tabelas privadas (CRUD restrito)
- Premissas:
  - `users` tem coluna `role` com valores `ADMIN`, `MANAGER`, `STAFF`, `CUSTOMER`.
  - Para políticas baseadas em `auth.uid()`, é necessário usar Supabase Auth. Como o projeto usa auth próprio, estas políticas servem para proteger acessos via Supabase (caso você opte por usar).
- Exemplo com Supabase Auth (opcional):
```sql
alter table orders enable row level security;

create policy "read own or public orders" on orders for select
using (
  -- Admin/Manager veem tudo
  exists(select 1 from users u where u.id = orders.user_id and u.role in ('ADMIN','MANAGER'))
  or orders.user_id = auth.uid()
);

create policy "insert customer orders" on orders for insert
with check (
  -- Permite clientes criarem seus próprios pedidos
  orders.user_id = auth.uid()
);

create policy "write staff" on orders for update
using (
  exists(select 1 from users u where u.id = auth.uid() and u.role in ('ADMIN','MANAGER','STAFF'))
);
```
- Caso não use Supabase Auth, mantenha acesso somente via API (Prisma). As rotas já validam permissões; RLS pode ser mínimo (apenas leitura pública no catálogo).

4. Buckets de Storage
- Leitura pública de imagens:
```sql
-- No Storage, configure policy de read pública para bucket 'public'
-- Escrita apenas para roles administrativas
```

## Vercel — Configuração do Projeto
1. Importar repositório
   - Vercel → New Project → Importar do GitHub → selecionar repositório.

2. Variáveis de ambiente
   - Produção e Preview (Vercel):
     - `DATABASE_URL` = `postgresql://postgres:<SENHA>@db.<hash>.supabase.co:6543/postgres?pgbouncer=true` (Transaction Pooler - Porta 6543)
     - `DIRECT_URL` = `postgresql://postgres:<SENHA>@db.<hash>.supabase.co:5432/postgres` (Session Pooler - Porta 5432 - Necessário para Migrations)
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://<project>.supabase.co` (se usar Supabase JS/Storage no cliente)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<anon key>` (somente se usar Supabase client-side)
     - `JWT_SECRET` = segredo do seu auth (já utilizado pelo projeto)
     - Outras usadas pelo app (verifique `src/lib/prisma.ts` e rotas em `src/app/api/*`).

3. Build & Output
   - Framework: Next.js (detectado automaticamente)
   - Build Command: `npm run build`
   - Output: `Next.js` (auto)
   - Node: padrão Vercel; o projeto usa runtime `nodejs` nas rotas (ex.: `src/app/api/notifications/route.ts:3`).

4. Serverless & Pooling
   - Prisma + Supabase: usar pooling (porta 6543) para evitar alto número de conexões.
   - Evitar `runtime = 'edge'` para rotas que usam Prisma.

5. Domains
   - Configure domínio customizado (opcional) e HTTPS (automático).

## Integração com Prisma
- Cliente Prisma: `src/lib/prisma.ts` usa `process.env.DATABASE_URL` e bloqueia ausência em produção (`src/lib/prisma.ts:18-26`, `src/lib/prisma.ts:43-46`).
- Rotas server-side importam `prisma` (ex.: `src/app/api/notifications/route.ts:2`).
- Antes do primeiro deploy, rode migrations contra o Supabase:
  - `npx prisma migrate deploy`
  - `npx prisma generate`

## Checklist de Migração (SQLite → Supabase)
1. Configurar `DATABASE_URL` local apontando para Supabase (com `sslmode=require` e `6543`).
2. Rodar `prisma migrate diff` se necessário, ajustar tipos.
3. Aplicar migrations no Supabase (`migrate deploy` ou SQL Editor).
4. Subir imagens para Storage (opcional) e atualizar URLs se necessário.
5. Testar local com `.env.local` conectado ao Supabase.
6. Configurar variáveis no Vercel (prod e preview) e redeploy.

## Segurança
- Manter chaves privadas fora do cliente (não expor `service_role`).
- `NEXT_PUBLIC_*` apenas para o que o cliente realmente precisa.
- Cookies de auth já são gerenciados pelas rotas do projeto (login/register).
- Em Supabase, habilitar RLS pelo menos nas tabelas sensíveis se houver uso de Supabase client.

## Observabilidade
- Vercel Analytics (opcional) e Logs.
- Supabase Logs: Postgres e Storage.
- Alertas de erro server-side nas rotas (já implementados em diversas rotas).

## Fluxos Críticos Validados
- Pedidos e totais (com adicionais) calculados server-side, compatíveis com produção.
- Impressão de pedido consolidada.
- Permissões administrativas (ProtectedRoute) consistentes no cliente.

## Troubleshooting
- Erro de conexão em produção: verifique `DATABASE_URL` e SSL/pooling.
- Prisma falhando: regenere client (`npm run db:generate`) e confirme schema.
- Execução em edge quebrando: assegure `export const runtime = 'nodejs'` em rotas que usam Prisma.

## Próximos Passos
- Criar ambiente Staging (novo projeto Vercel + novo projeto Supabase) para validação pré-prod.
- Adicionar GitHub Actions para `prisma migrate deploy` automático em merges para `main`.
- Acompanhar uso de pooling e ajustar limites se necessário.

