
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_business_member(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_business_member(uuid) to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Business owners can read their businesses" on public.businesses;
create policy "Business owners and members can read businesses" on public.businesses
  for select to authenticated using (owner_id = (select auth.uid()) or private.is_business_member(id));
drop policy if exists "Business owners can create businesses" on public.businesses;
create policy "Business owners can create businesses" on public.businesses
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "Business owners can update their businesses" on public.businesses;
create policy "Business owners can update their businesses" on public.businesses
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "Users can read their own business memberships" on public.business_members;
create policy "Users can read their own business memberships" on public.business_members
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Anyone can browse active listings" on public.listings;
create policy "Anyone can browse active listings" on public.listings
  for select to anon, authenticated using (status = 'active');
drop policy if exists "Sellers can read their own listings" on public.listings;
create policy "Sellers and business members can read their listings" on public.listings
  for select to authenticated using (
    seller_id = (select auth.uid()) or
    (business_id is not null and private.is_business_member(business_id))
  );
drop policy if exists "Sellers can create their own listings" on public.listings;
create policy "Sellers can create their own listings" on public.listings
  for insert to authenticated with check (
    seller_id = (select auth.uid()) and
    (business_id is null or private.is_business_member(business_id))
  );
drop policy if exists "Sellers can update their own listings" on public.listings;
create policy "Sellers can update their own listings" on public.listings
  for update to authenticated using (
    seller_id = (select auth.uid()) or
    (business_id is not null and private.is_business_member(business_id))
  ) with check (
    seller_id = (select auth.uid()) and
    (business_id is null or private.is_business_member(business_id))
  );
drop policy if exists "Sellers can delete their own listings" on public.listings;
create policy "Sellers can delete their own listings" on public.listings
  for delete to authenticated using (
    seller_id = (select auth.uid()) or
    (business_id is not null and private.is_business_member(business_id))
  );

drop policy if exists "Anyone can view media for active listings" on public.listing_media;
create policy "Anyone can view media for active listings" on public.listing_media
  for select to anon, authenticated using (
    exists (select 1 from public.listings l where l.id = listing_id and l.status = 'active')
  );
drop policy if exists "Listing owners can manage listing media" on public.listing_media;
create policy "Listing owners can manage listing media" on public.listing_media
  for all to authenticated using (
    exists (select 1 from public.listings l
      where l.id = listing_id and (
        l.seller_id = (select auth.uid()) or
        (l.business_id is not null and private.is_business_member(l.business_id))
      ))
  ) with check (
    exists (select 1 from public.listings l
      where l.id = listing_id and (
        l.seller_id = (select auth.uid()) or
        (l.business_id is not null and private.is_business_member(l.business_id))
      ))
  );

drop policy if exists "Users can read their own favorites" on public.favorites;
create policy "Users can read their own favorites" on public.favorites for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can add their own favorites" on public.favorites;
create policy "Users can add their own favorites" on public.favorites for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can remove their own favorites" on public.favorites;
create policy "Users can remove their own favorites" on public.favorites for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can read their own carts" on public.carts;
create policy "Users can read their own carts" on public.carts for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can create their own carts" on public.carts;
create policy "Users can create their own carts" on public.carts for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can update their own carts" on public.carts;
create policy "Users can update their own carts" on public.carts for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users can read their own cart items" on public.cart_items;
create policy "Users can read their own cart items" on public.cart_items for select to authenticated using (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
);
drop policy if exists "Users can add items to their own carts" on public.cart_items;
create policy "Users can add items to their own carts" on public.cart_items for insert to authenticated with check (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
);
drop policy if exists "Users can update items in their own carts" on public.cart_items;
create policy "Users can update items in their own carts" on public.cart_items for update to authenticated using (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
);
drop policy if exists "Users can remove items from their own carts" on public.cart_items;
create policy "Users can remove items from their own carts" on public.cart_items for delete to authenticated using (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
);

drop policy if exists "Users can read their own logbook entries" on public.logbook_entries;
create policy "Users can read their own logbook entries" on public.logbook_entries for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can create their own logbook entries" on public.logbook_entries;
create policy "Users can create their own logbook entries" on public.logbook_entries for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can update their own logbook entries" on public.logbook_entries;
create policy "Users can update their own logbook entries" on public.logbook_entries for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete their own logbook entries" on public.logbook_entries;
create policy "Users can delete their own logbook entries" on public.logbook_entries for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Customers can read their own appointments" on public.appointments;
create policy "Customers and assigned business members can read appointments" on public.appointments
  for select to authenticated using (
    customer_id = (select auth.uid()) or
    (business_id is not null and private.is_business_member(business_id))
  );
drop policy if exists "Customers can request appointments" on public.appointments;
create policy "Customers can request appointments" on public.appointments
  for insert to authenticated with check (customer_id = (select auth.uid()));
drop policy if exists "Customers can update their own appointments" on public.appointments;
create policy "Customers can cancel their own requested appointments" on public.appointments
  for update to authenticated using (
    customer_id = (select auth.uid()) and status = 'requested'
  ) with check (
    customer_id = (select auth.uid()) and status = 'cancelled'
  );
create policy "Business members can manage appointments" on public.appointments
  for update to authenticated using (
    business_id is not null and private.is_business_member(business_id)
  ) with check (
    business_id is not null and private.is_business_member(business_id)
  );

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
;
