CREATE TABLE "public"."businesses" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "owner_id"      uuid                     NOT NULL,
  "name"          text                     NOT NULL,
  "business_type" text                     NOT NULL,
  "description"   text,
  "logo_url"      text,
  "contact_phone" text,
  "city"          text,
  "status"        text                     NOT NULL DEFAULT 'pending'::text,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "businesses_business_type_check" CHECK ((business_type = ANY (ARRAY['marketplace_shop'::text, 'dealership'::text, 'food_drink'::text, 'real_estate'::text]))),
  CONSTRAINT "businesses_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 2) AND (char_length(TRIM(BOTH FROM name)) <= 160))),
  CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT "businesses_pkey" PRIMARY KEY (id),
  CONSTRAINT "businesses_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'closed'::text])))
);

ALTER TABLE "public"."businesses"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX businesses_owner_id_idx ON public.businesses USING btree (owner_id);

CREATE POLICY "Business owners and members can read businesses" ON "public"."businesses"
  FOR SELECT
  TO "authenticated"
  USING (((owner_id = ( SELECT auth.uid() AS uid)) OR private.is_business_member(id)));

CREATE POLICY "Business owners can create businesses" ON "public"."businesses"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Business owners can update their businesses" ON "public"."businesses"
  FOR UPDATE
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."businesses" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."businesses" TO "service_role";

REVOKE ALL ON TABLE "public"."businesses" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."businesses" TO "postgres";
