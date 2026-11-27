-- SELLSPACE: secure business listing ownership and workspace authorization.
-- Prepared 2026-11-27. Review and test on an isolated database before production.
-- This migration changes only the private helper/schema EXECUTE grants needed for RLS.
-- It does NOT alter table grants, Storage policies, Auth settings, listing-location
-- columns, or existing data.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Business access includes the workspace owner even when historical data has no
-- corresponding owner row in business_members. Every role with a membership row
-- may create its own listings; role/tier is deliberately not an eligibility gate.
create or replace function private.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.businesses b
      where b.id = target_business_id
        and b.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = target_business_id
        and bm.user_id = (select auth.uid())
    );
$$;

create or replace function private.is_business_owner(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = target_business_id
      and b.owner_id = (select auth.uid())
  );
$$;

revoke all on function private.is_business_member(uuid) from public, anon;
revoke all on function private.is_business_owner(uuid) from public, anon;
grant execute on function private.is_business_member(uuid) to authenticated;
grant execute on function private.is_business_owner(uuid) to authenticated;

-- A client session cannot transfer a listing between sellers or workspaces by
-- changing seller_id/business_id during an otherwise-authorized UPDATE.
-- Trusted service-role operations (which have no end-user auth.uid()) may perform
-- controlled transfers in a future, separately audited workflow.
create or replace function private.guard_listing_workspace_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and (
       new.seller_id is distinct from old.seller_id
       or new.business_id is distinct from old.business_id
     )
  then
    raise exception using
      errcode = '42501',
      message = 'Listing seller and business workspace cannot be changed by a client session';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_listing_workspace_identity() from public, anon, authenticated;

drop trigger if exists listings_guard_workspace_identity on public.listings;
create trigger listings_guard_workspace_identity
before update of seller_id, business_id on public.listings
for each row
execute function private.guard_listing_workspace_identity();

-- Public discovery stays limited to active listings. Authenticated workspace
-- access is limited to the creator's personal listings and the user's own
-- business workspace(s), including owner access without a membership row.
drop policy if exists "Sellers and business members can read their listings" on public.listings;
create policy "Sellers and business members can read their listings"
on public.listings
for select
to authenticated
using (
  (
    seller_id = (select auth.uid())
    and business_id is null
  )
  or (
    business_id is not null
    and private.is_business_member(business_id)
  )
);

-- Any authenticated user can sell personally. Any current business member,
-- regardless of membership role or subscription tier, can create listings
-- attributed to themselves in that exact workspace. Owners are recognized by
-- owner_id even if a membership row is missing.
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

-- A seller can manage their own personal listing or their own listing while
-- still belonging to that business workspace. The business owner can manage
-- every listing in their workspace. Mere membership is not sufficient to
-- update another seller's listing.
drop policy if exists "Sellers can update their own listings" on public.listings;
create policy "Sellers can update their own listings"
on public.listings
for update
to authenticated
using (
  (
    seller_id = (select auth.uid())
    and (
      business_id is null
      or private.is_business_member(business_id)
    )
  )
  or (
    business_id is not null
    and private.is_business_owner(business_id)
  )
)
with check (
  (
    seller_id = (select auth.uid())
    and (
      business_id is null
      or private.is_business_member(business_id)
    )
  )
  or (
    business_id is not null
    and private.is_business_owner(business_id)
  )
);

drop policy if exists "Sellers can delete their own listings" on public.listings;
create policy "Sellers can delete their own listings"
on public.listings
for delete
to authenticated
using (
  (
    seller_id = (select auth.uid())
    and (
      business_id is null
      or private.is_business_member(business_id)
    )
  )
  or (
    business_id is not null
    and private.is_business_owner(business_id)
  )
);

-- Public visitors can see media for active listings. Authenticated members
-- (including the business owner) can also see media for their own workspace's
-- drafts without receiving mutation rights over another seller's media.
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
  or (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.listings l
      where l.id = listing_media.listing_id
        and l.business_id is not null
        and private.is_business_member(l.business_id)
    )
  )
);

-- listing_media storage_path objects are uploaded under the listing creator's
-- user-id prefix. Keep media-row mutation with that creator while they retain
-- workspace access. Do not grant all business members media mutation: the
-- existing Storage policies intentionally enforce the same creator boundary.
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
      and l.seller_id = (select auth.uid())
      and (
        l.business_id is null
        or private.is_business_member(l.business_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_media.listing_id
      and l.seller_id = (select auth.uid())
      and (
        l.business_id is null
        or private.is_business_member(l.business_id)
      )
  )
);

commit;
