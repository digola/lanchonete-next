-- Habilitar a extensão pgcrypto se ainda não estiver habilitada
create extension if not exists "pgcrypto";

-- Habilitar Row Level Security (RLS) para todas as tabelas
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.adicionais enable row level security;
alter table public.product_adicionais enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_reviews enable row level security;
alter table public.tables enable row level security;
alter table public.settings enable row level security;
alter table public.notifications enable row level security;

-- Funções Auxiliares para verificar permissões
-- Verifica se o usuário é ADMIN
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid()::text
    and role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;

-- Verifica se o usuário é ADMIN ou MANAGER
create or replace function public.is_manager()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid()::text
    and role in ('ADMIN', 'MANAGER')
  );
end;
$$ language plpgsql security definer;

-- Verifica se o usuário é STAFF, MANAGER ou ADMIN
create or replace function public.is_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid()::text
    and role in ('ADMIN', 'MANAGER', 'STAFF')
  );
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- POLÍTICAS (POLICIES)
-- ==============================================================================

-- 1. USERS
-- Usuários podem ver apenas seu próprio perfil
create policy "Users can view own profile" on public.users
  for select using (auth.uid()::text = id);

-- Admin/Staff podem ver todos os usuários (para gestão de pedidos, etc)
create policy "Staff can view all users" on public.users
  for select using (public.is_staff());

-- Usuários podem atualizar seu próprio perfil
create policy "Users can update own profile" on public.users
  for update using (auth.uid()::text = id);

-- Apenas Admin pode criar/deletar usuários diretamente (via dashboard)
-- Nota: O cadastro (sign up) geralmente é feito via Auth API, que ignora RLS na criação inicial,
-- mas se for criar via tabela direta, precisa dessa policy.
create policy "Admins can manage users" on public.users
  for all using (public.is_admin());


-- 2. CATEGORIES (Público: Leitura / Staff: Escrita)
-- Todos podem ver categorias ativas
create policy "Public read categories" on public.categories
  for select using (true);

-- Apenas Managers/Admins podem criar/editar/deletar
create policy "Managers manage categories" on public.categories
  for all using (public.is_manager());


-- 3. PRODUCTS (Público: Leitura / Staff: Escrita)
-- Todos podem ver produtos
create policy "Public read products" on public.products
  for select using (true);

-- Apenas Managers/Admins podem gerenciar produtos
create policy "Managers manage products" on public.products
  for all using (public.is_manager());


-- 4. ADICIONAIS & PRODUCT_ADICIONAIS
create policy "Public read adicionais" on public.adicionais
  for select using (true);

create policy "Managers manage adicionais" on public.adicionais
  for all using (public.is_manager());

create policy "Public read product_adicionais" on public.product_adicionais
  for select using (true);

create policy "Managers manage product_adicionais" on public.product_adicionais
  for all using (public.is_manager());


-- 5. ORDERS (Pedidos)
-- Usuários veem apenas seus próprios pedidos
create policy "Users view own orders" on public.orders
  for select using (auth.uid()::text = "userId");

-- Staff vê todos os pedidos
create policy "Staff view all orders" on public.orders
  for select using (public.is_staff());

-- Usuários podem criar pedidos (insert)
create policy "Users create orders" on public.orders
  for insert with check (auth.uid()::text = "userId");

-- Staff pode atualizar pedidos (mudar status)
create policy "Staff update orders" on public.orders
  for update using (public.is_staff());


-- 6. ORDER ITEMS
-- Itens são visíveis se o usuário tem acesso ao pedido pai
-- Como JOINs em RLS podem ser lentos, simplificamos:
-- Se o usuário criou o pedido, ele vê os itens. Staff vê tudo.
create policy "Users view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where id = public.order_items."orderId"
      and "userId" = auth.uid()::text
    )
  );

create policy "Staff view all order items" on public.order_items
  for select using (public.is_staff());

create policy "Users create order items" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where id = public.order_items."orderId"
      and "userId" = auth.uid()::text
    )
  );


-- 7. ORDER REVIEWS
create policy "Public read reviews" on public.order_reviews
  for select using (true);

create policy "Users create reviews for own orders" on public.order_reviews
  for insert with check (auth.uid()::text = "userId");

create policy "Users update own reviews" on public.order_reviews
  for update using (auth.uid()::text = "userId");


-- 8. TABLES (Mesas)
-- Público pode ler status das mesas (ex: para saber se está livre)
create policy "Public read tables" on public.tables
  for select using (true);

-- Staff gerencia mesas
create policy "Staff manage tables" on public.tables
  for all using (public.is_staff());


-- 9. SETTINGS
-- Todos leem configurações públicas
create policy "Public read settings" on public.settings
  for select using (true);

-- Apenas Admin altera configurações
create policy "Admins manage settings" on public.settings
  for all using (public.is_admin());


-- 10. NOTIFICATIONS
-- Usuário vê apenas suas notificações
create policy "Users view own notifications" on public.notifications
  for select using (auth.uid()::text = "userId");

-- Usuário pode marcar como lida (update)
create policy "Users update own notifications" on public.notifications
  for update using (auth.uid()::text = "userId");

-- Staff pode criar notificações (para avisar que pedido está pronto, etc)
create policy "Staff create notifications" on public.notifications
  for insert with check (public.is_staff());


-- 11. STORAGE (Imagens)
-- Nota: Storage Policies são configuradas em "Storage" > "Policies" no dashboard,
-- mas aqui está o SQL equivalente se usar a tabela storage.objects (avançado).
-- Geralmente fazemos isso via UI.
-- Regra básica:
-- Bucket 'image_sdm': Public Read, Staff Upload.
