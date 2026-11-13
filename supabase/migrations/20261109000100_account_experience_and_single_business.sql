
-- ============================================================
-- SELLSPACE
-- ACCOUNT EXPERIENCE + SINGLE BUSINESS FOUNDATION
-- Migration: 20261109000100
--
-- REVIEW AND VALIDATION ONLY.
-- DO NOT APPLY TO PRODUCTION WITHOUT EXPLICIT APPROVAL.
-- ============================================================

begin;


-- ============================================================
-- 1. ACCOUNT EXPERIENCE
-- ============================================================

alter table public.account_setup
  add column if not exists marketplace_experience text;

alter table public.account_setup
  drop constraint if exists account_setup_marketplace_experience_check;

alter table public.account_setup
  add constraint account_setup_marketplace_experience_check
  check (
    marketplace_experience is null
    or marketplace_experience in ('buyer', 'seller', 'both')
  );


-- ============================================================
-- 2. ONBOARDING PROGRESS STEPS
-- ============================================================

alter table public.account_setup
  drop constraint if exists account_setup_current_step_check;

alter table public.account_setup
  alter column current_step set default 'welcome';

update public.account_setup
set current_step = 'profile'
where current_step = 'personal';

alter table public.account_setup
  add constraint account_setup_current_step_check
  check (
    current_step in (
      'welcome',
      'experience',
      'profile',
      'address',
      'store',
      'privacy',
      'complete'
    )
  );


-- ============================================================
-- 3. ACCOUNT SETUP PERMISSIONS
-- ============================================================

grant insert (
  user_id,
  birth_date,
  marketplace_experience,
  current_step,
  skipped_at
)
on public.account_setup
to authenticated;

grant update (
  birth_date,
  marketplace_experience,
  current_step,
  skipped_at
)
on public.account_setup
to authenticated;


-- ============================================================
-- 4. COMPLETED ACCOUNT PROTECTION
-- ============================================================

create or replace function public.prevent_completed_experience_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.completed_at is not null then

    if new.marketplace_experience
       is distinct from old.marketplace_experience then
      raise exception
        'Marketplace experience cannot be changed after account setup is completed';
    end if;

    if new.completed_at is distinct from old.completed_at
       or new.current_step is distinct from old.current_step then
      raise exception
        'Completed account setup cannot be modified';
    end if;

  end if;

  return new;
end;
$$;

drop trigger if exists account_setup_prevent_completed_experience_change
  on public.account_setup;

create trigger account_setup_prevent_completed_experience_change
before update on public.account_setup
for each row
execute function public.prevent_completed_experience_change();

revoke all on function public.prevent_completed_experience_change()
  from public, anon, authenticated;


-- ============================================================
-- 5. ONE BUSINESS STORE PER ACCOUNT
-- ============================================================

-- Duplicate-owner check completed before migration preparation.
create unique index if not exists businesses_one_store_per_owner
  on public.businesses(owner_id);


-- ============================================================
-- 6. DEDICATED BUSINESS LOGO STORAGE
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'business-logos',
  'business-logos',
  true,
  5242880,
  array['image/png', 'image/jpeg']::text[]
)
on conflict (id) do nothing;


-- Upload policy.
drop policy if exists business_logos_insert_own
  on storage.objects;

create policy business_logos_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);


-- Update policy.
drop policy if exists business_logos_update_own
  on storage.objects;

create policy business_logos_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);


-- Delete policy.
drop policy if exists business_logos_delete_own
  on storage.objects;

create policy business_logos_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);


-- ============================================================
-- 7. IDEMPOTENT SERVER-SIDE ACCOUNT FINALIZATION
-- ============================================================

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
  v_marketplace_experience text;

  v_profile_name text;
  v_profile_phone text;

  v_address_count integer;
  v_required_count integer;
  v_accepted_count integer;

  v_phone_verified boolean := false;
  v_completed_at timestamptz;

begin

  -- --------------------------------------------------------
  -- AUTHENTICATION
  -- --------------------------------------------------------

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;


  -- --------------------------------------------------------
  -- IDEMPOTENCY CHECK
  -- --------------------------------------------------------
  -- If setup is already complete, return the existing result.
  -- Do not perform another UPDATE on the completed account.

 select s.completed_at
 into v_completed_at
 from public.account_setup s
 where s.user_id = v_user_id
 for update;

  if v_completed_at is not null then

    select (u.phone_confirmed_at is not null)
    into v_phone_verified
    from auth.users u
    where u.id = v_user_id;

    return query
    select
      true,
      coalesce(v_phone_verified, false),
      v_completed_at;

    return;
  end if;


  -- --------------------------------------------------------
  -- LOAD ACCOUNT SETUP
  -- --------------------------------------------------------

  select
    s.birth_date,
    s.marketplace_experience
  into
    v_birth_date,
    v_marketplace_experience
  from public.account_setup s
  where s.user_id = v_user_id;


  -- --------------------------------------------------------
  -- MARKETPLACE EXPERIENCE
  -- --------------------------------------------------------

  if v_marketplace_experience is null
     or v_marketplace_experience not in ('buyer', 'seller', 'both') then
    raise exception 'Please select your marketplace experience';
  end if;


  -- --------------------------------------------------------
  -- AGE ELIGIBILITY
  -- --------------------------------------------------------

  if v_birth_date is null then
    raise exception 'Birth date is required';
  end if;

  if v_birth_date > (
    pg_catalog.current_date - interval '18 years'
  )::date then
    raise exception 'You must be at least 18 years old to use SELLSPACE';
  end if;


  -- --------------------------------------------------------
  -- PROFILE VALIDATION
  -- --------------------------------------------------------

  select
    p.display_name,
    p.phone
  into
    v_profile_name,
    v_profile_phone
  from public.profiles p
  where p.id = v_user_id;

  if v_profile_name is null
     or length(pg_catalog.btrim(v_profile_name)) = 0 then
    raise exception 'Full name is required';
  end if;

  if v_profile_phone is null
     or length(pg_catalog.btrim(v_profile_phone)) = 0 then
    raise exception 'Contact number is required';
  end if;


  -- --------------------------------------------------------
  -- DEFAULT DELIVERY ADDRESS
  -- --------------------------------------------------------

  select count(*)
  into v_address_count
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


  -- --------------------------------------------------------
  -- BUSINESS STORE REQUIREMENT
  -- --------------------------------------------------------

  if v_marketplace_experience in ('seller', 'both')
     and not exists (
       select 1
       from public.businesses b
       where b.owner_id = v_user_id
     ) then
    raise exception
      'Please create your business store before completing setup';
  end if;


  -- --------------------------------------------------------
  -- POLICY PUBLICATION CHECK
  -- --------------------------------------------------------

  select count(*)
  into v_required_count
  from public.account_setup_policy_documents d
  where d.active = true
    and d.policy_key in (
      'age_eligibility',
      'terms',
      'community_rules',
      'privacy'
    );

  if v_required_count <> 4 then
    raise exception
      'SELLSPACE onboarding policies are not fully published';
  end if;


  -- --------------------------------------------------------
  -- POLICY ACCEPTANCE CHECK
  -- --------------------------------------------------------

  select count(*)
  into v_accepted_count
  from public.account_setup_policy_documents d
  join public.policy_acceptances a
    on a.policy_key = d.policy_key
   and a.policy_version = d.version
   and a.user_id = v_user_id
  where d.active = true
    and d.policy_key in (
      'age_eligibility',
      'terms',
      'community_rules',
      'privacy'
    );

  if v_accepted_count <> 4 then
    raise exception
      'Please review and accept all current onboarding policies';
  end if;


  -- --------------------------------------------------------
  -- PHONE VERIFICATION STATUS
  -- --------------------------------------------------------

  select (u.phone_confirmed_at is not null)
  into v_phone_verified
  from auth.users u
  where u.id = v_user_id;


  -- --------------------------------------------------------
  -- COMPLETE ACCOUNT
  -- --------------------------------------------------------

  insert into public.account_setup (
    user_id,
    current_step,
    completed_at
  )
  values (
    v_user_id,
    'complete',
    pg_catalog.now()
  )
  on conflict (user_id) do update
  set
    current_step = 'complete',
    completed_at = coalesce(
      public.account_setup.completed_at,
      pg_catalog.now()
    ),
    skipped_at = null,
    updated_at = pg_catalog.now()
  returning public.account_setup.completed_at
  into v_completed_at;


  -- --------------------------------------------------------
  -- RETURN RESULT
  -- --------------------------------------------------------

  return query
  select
    true,
    coalesce(v_phone_verified, false),
    v_completed_at;

end;
$$;


-- ============================================================
-- 8. FINALIZATION FUNCTION PERMISSIONS
-- ============================================================

revoke all on function public.finalize_account_setup()
  from public, anon;

grant execute on function public.finalize_account_setup()
  to authenticated;


-- ============================================================
-- END MIGRATION
-- ============================================================

commit;
