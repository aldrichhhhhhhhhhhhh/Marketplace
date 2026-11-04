-- SELLSPACE Quick Account Setup v1
-- REVIEW PROPOSAL ONLY. DO NOT APPLY TO PRODUCTION.
-- Historical Supabase migrations in the live project are not yet reconciled
-- with this repository. Move into a numbered migration only after that audit.

create table if not exists public.account_setup (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_at timestamptz,
  current_step text not null default 'welcome'
    check (current_step in ('welcome', 'personal', 'address', 'privacy', 'complete')),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  house_unit text not null,
  street text not null,
  barangay text not null,
  city_municipality text not null,
  region text not null,
  country text not null,
  postal_code text,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_addresses_user_id_idx
  on public.user_addresses(user_id);

create table if not exists public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_key text not null
    check (policy_key in ('eligibility_18_plus', 'terms', 'community_rules', 'privacy_notice')),
  policy_version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, policy_key, policy_version)
);

create index if not exists policy_acceptances_user_id_idx
  on public.policy_acceptances(user_id);

alter table public.account_setup enable row level security;
alter table public.user_addresses enable row level security;
alter table public.policy_acceptances enable row level security;

create policy "Users read own account setup"
  on public.account_setup for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users insert own account setup progress"
  on public.account_setup for insert to authenticated
  with check (user_id = (select auth.uid()) and completed_at is null);

create policy "Users update own incomplete account setup progress"
  on public.account_setup for update to authenticated
  using (user_id = (select auth.uid()) and completed_at is null)
  with check (user_id = (select auth.uid()) and completed_at is null);

create policy "Users manage own addresses"
  on public.user_addresses for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users read own policy acceptances"
  on public.policy_acceptances for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users insert own policy acceptances"
  on public.policy_acceptances for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Intentionally no client UPDATE/DELETE policy on policy_acceptances.
-- A server-side finalization function is still required. It must verify the
-- auth.users phone_confirmed_at and phone value, calculate age using a
-- validated birth date, validate address completeness and active policy
-- versions, then set completed_at. That function is omitted pending legal
-- review, auth-provider verification, and migration-history reconciliation.
