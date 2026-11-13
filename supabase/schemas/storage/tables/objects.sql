CREATE POLICY "Authenticated sellers upload their listing images" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) AND (EXISTS ( SELECT 1
   FROM public.listings l
  WHERE (((l.id)::text = (storage.foldername(objects.name))[2]) AND (l.seller_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "Sellers delete their listing images" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) AND (EXISTS ( SELECT 1
   FROM public.listings l
  WHERE (((l.id)::text = (storage.foldername(objects.name))[2]) AND (l.seller_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "Sellers update their listing images" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) AND (EXISTS ( SELECT 1
   FROM public.listings l
  WHERE (((l.id)::text = (storage.foldername(objects.name))[2]) AND (l.seller_id = ( SELECT auth.uid() AS uid)))))))
  WITH CHECK (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) AND (EXISTS ( SELECT 1
   FROM public.listings l
  WHERE (((l.id)::text = (storage.foldername(objects.name))[2]) AND (l.seller_id = ( SELECT auth.uid() AS uid)))))));
