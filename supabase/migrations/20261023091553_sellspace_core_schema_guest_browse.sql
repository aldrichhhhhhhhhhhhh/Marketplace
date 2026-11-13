
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(trim(display_name)) between 1 and 120),
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  business_type text not null check (business_type in ('marketplace_shop','dealership','food_drink','real_estate')),
  description text,
  logo_url text,
  contact_phone text,
  city text,
  status text not null default 'pending' check (status in ('pending','active','suspended','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  seller_id uuid not null references auth.users(id) on delete restrict,
  listing_type text not null check (listing_type in ('product','vehicle','food','property','service')),
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  category text,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  condition text check (condition is null or condition in ('new','like_new','good','fair','used')),
  city text,
  status text not null default 'draft' check (status in ('draft','active','paused','sold','archived')),
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  media_type text not null default 'image' check (media_type in ('image','video')),
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (listing_id, storage_path)
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete restrict,
  quantity integer not null default 1 check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, listing_id)
);

create table if not exists public.logbook_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  entry_type text not null check (entry_type in ('inquiry','viewing','test_drive','purchase','follow_up','note')),
  status text not null default 'open' check (status in ('open','scheduled','completed','cancelled','archived')),
  title text not null check (char_length(trim(title)) between 1 and 200),
  notes text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  appointment_type text not null check (appointment_type in ('viewing','test_drive','consultation','pickup')),
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled','declined')),
  requested_at timestamptz not null default now(),
  scheduled_at timestamptz,
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  body text,
  notification_type text not null default 'general',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists businesses_owner_id_idx on public.businesses(owner_id);
create index if not exists business_members_user_id_idx on public.business_members(user_id);
create index if not exists listings_public_browse_idx on public.listings(status, listing_type, created_at desc);
create index if not exists listings_seller_id_idx on public.listings(seller_id);
create index if not exists listings_business_id_idx on public.listings(business_id);
create index if not exists listing_media_listing_sort_idx on public.listing_media(listing_id, sort_order);
create index if not exists favorites_listing_id_idx on public.favorites(listing_id);
create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);
create index if not exists logbook_user_created_idx on public.logbook_entries(user_id, created_at desc);
create index if not exists appointments_customer_created_idx on public.appointments(customer_id, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.favorites enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.logbook_entries enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;

create policy "Users can read their own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users can create their own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Business owners can read their businesses" on public.businesses
  for select to authenticated using (owner_id = auth.uid());
create policy "Business owners can create businesses" on public.businesses
  for insert to authenticated with check (owner_id = auth.uid());
create policy "Business owners can update their businesses" on public.businesses
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can read their own business memberships" on public.business_members
  for select to authenticated using (user_id = auth.uid());

create policy "Anyone can browse active listings" on public.listings
  for select to anon, authenticated using (status = 'active');
create policy "Sellers can read their own listings" on public.listings
  for select to authenticated using (seller_id = auth.uid());
create policy "Sellers can create their own listings" on public.listings
  for insert to authenticated with check (seller_id = auth.uid());
create policy "Sellers can update their own listings" on public.listings
  for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "Sellers can delete their own listings" on public.listings
  for delete to authenticated using (seller_id = auth.uid());

create policy "Anyone can view media for active listings" on public.listing_media
  for select to anon, authenticated using (
    exists (select 1 from public.listings l where l.id = listing_id and l.status = 'active')
  );
create policy "Listing owners can manage listing media" on public.listing_media
  for all to authenticated using (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
  ) with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
  );

create policy "Users can read their own favorites" on public.favorites
  for select to authenticated using (user_id = auth.uid());
create policy "Users can add their own favorites" on public.favorites
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users can remove their own favorites" on public.favorites
  for delete to authenticated using (user_id = auth.uid());

create policy "Users can read their own carts" on public.carts
  for select to authenticated using (user_id = auth.uid());
create policy "Users can create their own carts" on public.carts
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update their own carts" on public.carts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can read their own cart items" on public.cart_items
  for select to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );
create policy "Users can add items to their own carts" on public.cart_items
  for insert to authenticated with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );
create policy "Users can update items in their own carts" on public.cart_items
  for update to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );
create policy "Users can remove items from their own carts" on public.cart_items
  for delete to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

create policy "Users can read their own logbook entries" on public.logbook_entries
  for select to authenticated using (user_id = auth.uid());
create policy "Users can create their own logbook entries" on public.logbook_entries
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update their own logbook entries" on public.logbook_entries
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete their own logbook entries" on public.logbook_entries
  for delete to authenticated using (user_id = auth.uid());

create policy "Customers can read their own appointments" on public.appointments
  for select to authenticated using (customer_id = auth.uid());
create policy "Customers can request appointments" on public.appointments
  for insert to authenticated with check (customer_id = auth.uid());
create policy "Customers can update their own appointments" on public.appointments
  for update to authenticated using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy "Users can read their own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "Users can update their own notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
;
