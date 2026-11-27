-- EMERGENCY ROLLBACK ONLY — SELLSPACE Phase 1 security migrations.
-- Do not run as routine maintenance. This restores the pre-migration vulnerable
-- authorization and broad grants from the 2026-11-27 catalog snapshot.
-- Requires explicit approval and a fresh preflight comparison.
-- Run this file only if migrations 20261127000100, 20261127000200, and 20261127000300 were applied,
-- and only in reverse migration order.

begin;

-- Roll back migration 003 first: restore the pre-migration business,
-- membership, appointment and notification client permissions/policies.
grant insert, update on table public.businesses to authenticated;
grant insert, update, delete on table public.business_members to authenticated;
grant update on table public.notifications to authenticated;

drop policy if exists "Business owners can create pending businesses" on public.businesses;
create policy "Business owners can create businesses"
on public.businesses
for insert
to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "Customers can request appointments" on public.appointments;
create policy "Customers can request appointments"
on public.appointments
for insert
to authenticated
with check (customer_id = (select auth.uid()));

-- Roll back migration 002: restore the prior anonymous table grants.
grant select, insert, update, delete, truncate, references, trigger, maintain on table
  public.appointments,
  public.business_members,
  public.businesses,
  public.cart_items,
  public.carts,
  public.favorites,
  public.listing_media,
  public.listings,
  public.logbook_entries,
  public.notifications,
  public.profiles
to anon;

-- Restore the prior authenticated dangerous table privileges. These are
-- intentionally broad and should only be restored to recover a proven outage.
grant truncate, references, trigger, maintain on table
  public.appointments,
  public.business_members,
  public.businesses,
  public.cart_items,
  public.carts,
  public.favorites,
  public.listing_media,
  public.listings,
  public.logbook_entries,
  public.notifications,
  public.profiles
to authenticated;

-- Restore the prior future-object defaults for postgres-owned public objects.
alter default privileges for role postgres in schema public
  grant delete, insert, maintain, references, select, trigger, truncate, update
  on tables to anon, authenticated;

alter default privileges for role postgres in schema public
  grant select, update, usage on sequences to anon, authenticated;

alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated;

grant execute on function public.set_marketplace_order_updated_at()
to public, anon, authenticated;

-- Roll back migration 001: remove policies that depend on the new owner helper
-- before dropping that helper. Then restore the original membership-only helper.
drop policy if exists "Sellers and business members can read their listings" on public.listings;
drop policy if exists "Sellers can create their own listings" on public.listings;
drop policy if exists "Sellers can update their own listings" on public.listings;
drop policy if exists "Sellers can delete their own listings" on public.listings;

drop trigger if exists listings_guard_workspace_identity on public.listings;
drop function if exists private.guard_listing_workspace_identity();

create or replace function private.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = (select auth.uid())
  );
$;

revoke all on function private.is_business_member(uuid) from public, anon;
grant execute on function private.is_business_member(uuid) to authenticated;
drop function if exists private.is_business_owner(uuid);

-- Restore original listing policies.
drop policy if exists "Sellers and business members can read their listings" on public.listings;
create policy "Sellers and business members can read their listings"
on public.listings
for select
to authenticated
using (
  seller_id = (select auth.uid())
  or (
    business_id is not null
    and private.is_business_member(business_id)
  )
);

drop policy if exists "Sellers can create their own listings" on public.listings;
create policy "Sellers can create their own listings"
on public.listings
for insert
to authenticated
with check (
  seller_id = (select auth.uid())
  and (
    business_id is null
    or private.is_business_member(business_id)
  )
);

drop policy if exists "Sellers can update their own listings" on public.listings;
create policy "Sellers can update their own listings"
on public.listings
for update
to authenticated
using (
  seller_id = (select auth.uid())
  or (
    business_id is not null
    and private.is_business_member(business_id)
  )
)
with check (
  seller_id = (select auth.uid())
  and (
    business_id is null
    or private.is_business_member(business_id)
  )
);

drop policy if exists "Sellers can delete their own listings" on public.listings;
create policy "Sellers can delete their own listings"
on public.listings
for delete
to authenticated
using (
  seller_id = (select auth.uid())
  or (
    business_id is not null
    and private.is_business_member(business_id)
  )
);

-- Restore original media visibility and membership-wide media-row mutation.
drop policy if exists "Anyone can view media for active listings" on public.listing_media;
create policy "Anyone can view media for active listings"
on public.listing_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_media.listing_id
      and l.status = 'active'
  )
);

drop policy if exists "Listing owners can manage listing media" on public.listing_media;
create policy "Listing owners can manage listing media"
on public.listing_media
for all
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_media.listing_id
      and (
        l.seller_id = (select auth.uid())
        or (
          l.business_id is not null
          and private.is_business_member(l.business_id)
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_media.listing_id
      and (
        l.seller_id = (select auth.uid())
        or (
          l.business_id is not null
          and private.is_business_member(l.business_id)
        )
      )
  )
);

commit;
