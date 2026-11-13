CREATE TABLE "public"."appointments" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"      uuid                     NOT NULL,
  "business_id"      uuid,
  "listing_id"       uuid,
  "appointment_type" text                     NOT NULL,
  "status"           text                     NOT NULL DEFAULT 'requested'::text,
  "requested_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "scheduled_at"     timestamp with time zone,
  "customer_note"    text,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "appointments_appointment_type_check" CHECK ((appointment_type = ANY (ARRAY['viewing'::text, 'test_drive'::text, 'consultation'::text, 'pickup'::text]))),
  CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "appointments_pkey" PRIMARY KEY (id),
  CONSTRAINT "appointments_status_check" CHECK ((status = ANY (ARRAY['requested'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text, 'declined'::text]))),
  CONSTRAINT "appointments_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL,
  CONSTRAINT "appointments_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL
);

ALTER TABLE "public"."appointments"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX appointments_customer_created_idx ON public.appointments USING btree (customer_id, created_at DESC);

CREATE POLICY "Customers and assigned business members can read appointments" ON "public"."appointments"
  FOR SELECT
  TO "authenticated"
  USING (((customer_id = ( SELECT auth.uid() AS uid)) OR ((business_id IS NOT NULL) AND private.is_business_member(business_id))));

CREATE POLICY "Customers can request appointments" ON "public"."appointments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((customer_id = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."appointments" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."appointments" TO "service_role";

REVOKE ALL ON TABLE "public"."appointments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."appointments" TO "postgres";
