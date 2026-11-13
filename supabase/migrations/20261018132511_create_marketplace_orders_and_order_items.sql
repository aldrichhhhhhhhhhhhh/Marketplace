
create extension if not exists pgcrypto;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  recipient_name text not null check (length(trim(recipient_name)) between 1 and 120),
  phone text not null check (length(trim(phone)) between 7 and 30),
  address text not null check (length(trim(address)) between 3 and 500),
  city text not null check (length(trim(city)) between 2 and 120),
  postal_code text not null check (length(trim(postal_code)) between 2 and 20),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  delivery_fee numeric(10,2) not null check (delivery_fee >= 0),
  total numeric(10,2) not null check (total = subtotal + delivery_fee),
  payment_method text not null default 'cod' check (payment_method = 'cod'),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null check (length(trim(product_name)) between 1 and 200),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0 and quantity <= 99),
  line_total numeric(10,2) not null check (line_total = unit_price * quantity),
  created_at timestamptz not null default now()
);

create index orders_user_created_at_idx on public.orders (user_id, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);

create or replace function public.set_marketplace_order_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_marketplace_order_updated_at
before update on public.orders
for each row execute function public.set_marketplace_order_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
grant select on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

create policy "Customers can read their own orders"
on public.orders for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Customers can read items from their own orders"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);
;
