-- SELLSPACE: constrain client-writable workflow and moderation fields.
-- Prepared 2026-11-27. Review/test on an isolated database before production.
-- Depends on 20261127000100_harden_business_listing_authorization.sql.
-- No Storage, Auth, checkout, or listing-location schema changes.

begin;

-- Business profile clients may create a pending workspace and edit public profile
-- fields only. Moderation status, owner identity, primary key and timestamps are
-- controlled by trusted backend/admin workflows.
revoke insert, update on table public.businesses from authenticated;
grant insert (owner_id, name, business_type, description, logo_url, contact_phone, city)
on table public.businesses to authenticated;
grant update (name, description, logo_url, contact_phone, city)
on table public.businesses to authenticated;

drop policy if exists "Business owners can create businesses" on public.businesses;
create policy "Business owners can create pending businesses"
on public.businesses
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status = 'pending'
);

-- Membership administration is not a direct client operation. Until the
-- invitation/acceptance and owner/admin workflow exists, clients may only read
-- their own membership row. Selling/listing eligibility is not restricted.
revoke insert, update, delete on table public.business_members from authenticated;

-- Clients may request appointments, but may not self-confirm or complete them
-- by supplying a non-requested status in the INSERT payload.
drop policy if exists "Customers can request appointments" on public.appointments;
create policy "Customers can request appointments"
on public.appointments
for insert
to authenticated
with check (
  customer_id = (select auth.uid())
  and status = 'requested'
);

-- The mobile client creates a draft and explicitly activates it in a separate
-- UPDATE after media upload. Prevent clients from inserting a directly active
-- listing while preserving the existing publish sequence.
drop policy if exists "Sellers can create their own listings" on public.listings;
create policy "Sellers can create their own listings"
on public.listings
for insert
to authenticated
with check (
  seller_id = (select auth.uid())
  and status = 'draft'
  and (
    business_id is null
    or private.is_business_member(business_id)
  )
);

-- Notifications are user-owned, but the client may only mutate the read marker.
-- The existing RLS policy continues to constrain the row to auth.uid().
revoke update on table public.notifications from authenticated;
grant update (read_at) on table public.notifications to authenticated;

commit;
