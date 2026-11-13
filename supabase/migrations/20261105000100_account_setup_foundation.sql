-- SELLSPACE account setup foundation                                                                                              
-- Prepared for review and dry-run only. Do NOT apply to production without approval.
-- Phone verification is intentionally separate from onboarding completion.
-- This migration does not modify existing marketplace tables or Auth configuration.

begin;

create table if not exists public.account_setup (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birth_date date,
  current_step text not null default 'personal'
    check (current_step in ('welcome', 'personal', 'address', 'privacy', 'complete')),
  skipped_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address_label text not null default 'Home',
  house_number text not null,
  street text not null,
  barangay text not null,
  city_municipality text not null,
  region text not null,
  country text not null default 'Philippines',
  postal_code text,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_addresses_house_number_nonempty check (length(trim(house_number)) > 0),
  constraint user_addresses_street_nonempty check (length(trim(street)) > 0),
  constraint user_addresses_barangay_nonempty check (length(trim(barangay)) > 0),
  constraint user_addresses_city_nonempty check (length(trim(city_municipality)) > 0),
  constraint user_addresses_region_nonempty check (length(trim(region)) > 0),
  constraint user_addresses_country_nonempty check (length(trim(country)) > 0)
);

create unique index if not exists user_addresses_one_default_per_user
  on public.user_addresses(user_id) where is_default = true;
create index if not exists user_addresses_user_id_idx
  on public.user_addresses(user_id);

create table if not exists public.account_setup_policy_documents (
  policy_key text primary key
    check (policy_key in ('age_eligibility', 'terms', 'community_rules', 'privacy')),
  version text not null,
  document_url text not null,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Inactive placeholders are deliberately not acceptable for onboarding.
insert into public.account_setup_policy_documents
  (policy_key, version, document_url, active)
values
  ('age_eligibility', 'draft-1', 'https://sellspace-corporate.vercel.app/terms', false),
  ('terms', 'draft-1', 'https://sellspace-corporate.vercel.app/terms', false),
  ('community_rules', 'draft-1', 'https://sellspace-corporate.vercel.app/community-rules', false),
  ('privacy', 'draft-1', 'https://sellspace-corporate.vercel.app/privacy', false)
on conflict (policy_key) do nothing;

create table if not exists public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_key text not null
    references public.account_setup_policy_documents(policy_key),
  policy_version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, policy_key, policy_version)
);

create index if not exists policy_acceptances_user_id_idx
  on public.policy_acceptances(user_id);

alter table public.account_setup enable row level security;
alter table public.user_addresses enable row level security;
alter table public.account_setup_policy_documents enable row level security;
alter table public.policy_acceptances enable row level security;

revoke all on table public.account_setup from anon, authenticated;
revoke all on table public.user_addresses from anon, authenticated;
revoke all on table public.account_setup_policy_documents from anon, authenticated;
revoke all on table public.policy_acceptances from anon, authenticated;

grant select on table public.account_setup to authenticated;
grant insert (user_id, birth_date, current_step, skipped_at)
  on table public.account_setup to authenticated;
grant update (birth_date, current_step, skipped_at)
  on table public.account_setup to authenticated;
grant select, insert, update, delete on table public.user_addresses to authenticated;
grant select on table public.account_setup_policy_documents to authenticated;
grant select, insert on table public.policy_acceptances to authenticated;

drop policy if exists account_setup_select_own on public.account_setup;
create policy account_setup_select_own on public.account_setup
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists account_setup_insert_own on public.account_setup;
create policy account_setup_insert_own on public.account_setup
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and completed_at is null
    and current_step <> 'complete'
  );

drop policy if exists account_setup_update_own on public.account_setup;
create policy account_setup_update_own on public.account_setup
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and completed_at is null
    and current_step <> 'complete'
  )
  with check (
    user_id = (select auth.uid())
    and completed_at is null
    and current_step <> 'complete'
  );

drop policy if exists user_addresses_select_own on public.user_addresses;
create policy user_addresses_select_own on public.user_addresses
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists user_addresses_insert_own on public.user_addresses;
create policy user_addresses_insert_own on public.user_addresses
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists user_addresses_update_own on public.user_addresses;
create policy user_addresses_update_own on public.user_addresses
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists user_addresses_delete_own on public.user_addresses;
create policy user_addresses_delete_own on public.user_addresses
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists active_policy_documents_read on public.account_setup_policy_documents;
create policy active_policy_documents_read on public.account_setup_policy_documents
  for select to authenticated using (active = true);

drop policy if exists policy_acceptances_select_own on public.policy_acceptances;
create policy policy_acceptances_select_own on public.policy_acceptances
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists policy_acceptances_insert_own_active_version on public.policy_acceptances;
create policy policy_acceptances_insert_own_active_version on public.policy_acceptances
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.account_setup_policy_documents d
      where d.policy_key = policy_acceptances.policy_key
        and d.version = policy_acceptances.policy_version
        and d.active = true
    )
  );

create or replace function public.set_account_setup_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists account_setup_set_updated_at on public.account_setup;
create trigger account_setup_set_updated_at
before update on public.account_setup
for each row execute function public.set_account_setup_updated_at();

drop trigger if exists user_addresses_set_updated_at on public.user_addresses;
create trigger user_addresses_set_updated_at
before update on public.user_addresses
for each row execute function public.set_account_setup_updated_at();

revoke all on function public.set_account_setup_updated_at() from public, anon, authenticated;
grant execute on function public.set_account_setup_updated_at() to service_role;

-- Finalization is the only way to set completed_at.
-- It checks the authenticated user, profile, address, age and current policy versions.
-- Phone verification is returned as a separate status and is NOT fabricated or required here.
create or replace function public.finalize_account_setup()
returns table (
  "completed" boolean,
  phone_verified boolean,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_birth_date date;
  v_profile_name text;
  v_profile_phone text;
  v_address_count integer;
  v_required_count integer;
  v_accepted_count integer;
  v_phone_verified boolean := false;
  v_completed_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select s.birth_date
    into v_birth_date
  from public.account_setup s
  where s.user_id = v_user_id;

  if v_birth_date is null then
    raise exception 'Birth date is required';
  end if;

  if v_birth_date > (pg_catalog.current_date - interval '18 years')::date then
    raise exception 'You must be at least 18 years old to use SELLSPACE';
  end if;

  select p.display_name, p.phone
    into v_profile_name, v_profile_phone
  from public.profiles p
  where p.id = v_user_id;

  if v_profile_name is null or length(pg_catalog.btrim(v_profile_name)) = 0 then
    raise exception 'Full name is required';
  end if;

  if v_profile_phone is null or length(pg_catalog.btrim(v_profile_phone)) = 0 then
    raise exception 'Contact number is required';
  end if;

  select count(*) into v_address_count
  from public.user_addresses a
  where a.user_id = v_user_id
    and length(pg_catalog.btrim(a.house_number)) > 0
    and length(pg_catalog.btrim(a.street)) > 0
    and length(pg_catalog.btrim(a.barangay)) > 0
    and length(pg_catalog.btrim(a.city_municipality)) > 0
    and length(pg_catalog.btrim(a.region)) > 0
    and length(pg_catalog.btrim(a.country)) > 0
    and a.is_default = true;

  if v_address_count = 0 then
    raise exception 'A complete default delivery address is required';
  end if;

  select count(*) into v_required_count
  from public.account_setup_policy_documents d
  where d.active = true
    and d.policy_key in ('age_eligibility', 'terms', 'community_rules', 'privacy');

  if v_required_count <> 4 then
    raise exception 'SELLSPACE onboarding policies are not fully published';
  end if;

  select count(*) into v_accepted_count
  from public.account_setup_policy_documents d
  join public.policy_acceptances a
    on a.policy_key = d.policy_key
   and a.policy_version = d.version
   and a.user_id = v_user_id
  where d.active = true
    and d.policy_key in ('age_eligibility', 'terms', 'community_rules', 'privacy');

  if v_accepted_count <> 4 then
    raise exception 'Please review and accept all current onboarding policies';
  end if;

  -- Auth phone verification is deliberately checked independently.
  select (u.phone_confirmed_at is not null)
    into v_phone_verified
  from auth.users u
  where u.id = v_user_id;

  insert into public.account_setup (user_id, current_step, completed_at)
  values (v_user_id, 'complete', pg_catalog.now())
  on conflict (user_id) do update
    set current_step = 'complete',
        completed_at = coalesce(public.account_setup.completed_at, pg_catalog.now()),
        skipped_at = null,
        updated_at = pg_catalog.now()
  returning public.account_setup.completed_at into v_completed_at;

  return query select true, coalesce(v_phone_verified, false), v_completed_at;
end;
$$;

revoke all on function public.finalize_account_setup() from public, anon;
grant execute on function public.finalize_account_setup() to authenticated;

commit;