CREATE TABLE "public"."listings" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "business_id"      uuid,
  "seller_id"        uuid                     NOT NULL,
  "listing_type"     text                     NOT NULL,
  "title"            text                     NOT NULL,
  "description"      text,
  "category"         text,
  "price"            numeric(12,2)            NOT NULL DEFAULT 0,
  "currency"         text                     NOT NULL DEFAULT 'PHP'::text,
  "condition"        text,
  "city"             text,
  "status"           text                     NOT NULL DEFAULT 'draft'::text,
  "attributes"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "location_address" text,
  "latitude"         double precision,
  "longitude"        double precision,
  "location_source"  text,
  CONSTRAINT "listings_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL,
  CONSTRAINT "listings_condition_check" CHECK (((condition IS NULL) OR (condition = ANY (ARRAY['new'::text, 'like_new'::text, 'good'::text, 'fair'::text, 'used'::text])))),
  CONSTRAINT "listings_currency_check" CHECK ((currency ~ '^[A-Z]{3}$'::text)),
  CONSTRAINT "listings_latitude_check" CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::double precision) AND (latitude <= (90)::double precision)))),
  CONSTRAINT "listings_listing_type_check" CHECK ((listing_type = ANY (ARRAY['product'::text, 'vehicle'::text, 'food'::text, 'property'::text, 'service'::text]))),
  CONSTRAINT "listings_location_source_check" CHECK (((location_source IS NULL) OR (location_source = ANY (ARRAY['gps'::text, 'search'::text, 'map'::text, 'manual'::text])))),
  CONSTRAINT "listings_longitude_check" CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::double precision) AND (longitude <= (180)::double precision)))),
  CONSTRAINT "listings_pkey" PRIMARY KEY (id),
  CONSTRAINT "listings_price_check" CHECK ((price >= (0)::numeric)),
  CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT "listings_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'sold'::text, 'archived'::text]))),
  CONSTRAINT "listings_title_check" CHECK (((char_length(TRIM(BOTH FROM title)) >= 2) AND (char_length(TRIM(BOTH FROM title)) <= 200)))
);

ALTER TABLE "public"."listings"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX listings_business_id_idx ON public.listings USING btree (business_id);

CREATE INDEX listings_public_browse_idx ON public.listings USING btree (status, listing_type, created_at DESC);

CREATE INDEX listings_seller_id_idx ON public.listings USING btree (seller_id);

CREATE POLICY "Anyone can browse active listings" ON "public"."listings"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((status = 'active'::text));

CREATE POLICY "Sellers and business members can read their listings" ON "public"."listings"
  FOR SELECT
  TO "authenticated"
  USING (((seller_id = ( SELECT auth.uid() AS uid)) OR ((business_id IS NOT NULL) AND private.is_business_member(business_id))));

CREATE POLICY "Sellers can create their own listings" ON "public"."listings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((seller_id = ( SELECT auth.uid() AS uid)) AND ((business_id IS NULL) OR private.is_business_member(business_id))));

CREATE POLICY "Sellers can delete their own listings" ON "public"."listings"
  FOR DELETE
  TO "authenticated"
  USING (((seller_id = ( SELECT auth.uid() AS uid)) OR ((business_id IS NOT NULL) AND private.is_business_member(business_id))));

CREATE POLICY "Sellers can update their own listings" ON "public"."listings"
  FOR UPDATE
  TO "authenticated"
  USING (((seller_id = ( SELECT auth.uid() AS uid)) OR ((business_id IS NOT NULL) AND private.is_business_member(business_id))))
  WITH CHECK (((seller_id = ( SELECT auth.uid() AS uid)) AND ((business_id IS NULL) OR private.is_business_member(business_id))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "service_role";

REVOKE ALL ON TABLE "public"."listings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "postgres";
