insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated sellers upload their listing images" on storage.objects;
create policy "Authenticated sellers upload their listing images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.listings l
    where l.id::text = (storage.foldername(name))[2]
      and l.seller_id = (select auth.uid())
  )
);

drop policy if exists "Sellers update their listing images" on storage.objects;
create policy "Sellers update their listing images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.listings l
    where l.id::text = (storage.foldername(name))[2]
      and l.seller_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.listings l
    where l.id::text = (storage.foldername(name))[2]
      and l.seller_id = (select auth.uid())
  )
);

drop policy if exists "Sellers delete their listing images" on storage.objects;
create policy "Sellers delete their listing images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.listings l
    where l.id::text = (storage.foldername(name))[2]
      and l.seller_id = (select auth.uid())
  )
);;
