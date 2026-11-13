CREATE TABLE "public"."listing_media" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "listing_id"   uuid                     NOT NULL,
  "storage_path" text                     NOT NULL,
  "media_type"   text                     NOT NULL DEFAULT 'image'::text,
  "alt_text"     text,
  "sort_order"   integer                  NOT NULL DEFAULT 0,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "listing_media_listing_id_storage_path_key" UNIQUE (listing_id, storage_path),
  CONSTRAINT "listing_media_media_type_check" CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text]))),
  CONSTRAINT "listing_media_pkey" PRIMARY KEY (id),
  CONSTRAINT "listing_media_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE
);

ALTER TABLE "public"."listing_media"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX listing_media_listing_sort_idx ON public.listing_media USING btree (listing_id, sort_order);

CREATE POLICY "Anyone can view media for active listings" ON "public"."listing_media"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = listing_media.listing_id) AND (l.status = 'active'::text)))));

CREATE POLICY "Listing owners can manage listing media" ON "public"."listing_media"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = listing_media.listing_id) AND ((l.seller_id = ( SELECT auth.uid() AS uid)) OR ((l.business_id IS NOT NULL) AND private.is_business_member(l.business_id)))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = listing_media.listing_id) AND ((l.seller_id = ( SELECT auth.uid() AS uid)) OR ((l.business_id IS NOT NULL) AND private.is_business_member(l.business_id)))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_media" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_media" TO "service_role";

REVOKE ALL ON TABLE "public"."listing_media" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_media" TO "postgres";
