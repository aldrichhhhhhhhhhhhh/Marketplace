CREATE TABLE "public"."logbook_entries" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      uuid                     NOT NULL,
  "business_id"  uuid,
  "listing_id"   uuid,
  "entry_type"   text                     NOT NULL,
  "status"       text                     NOT NULL DEFAULT 'open'::text,
  "title"        text                     NOT NULL,
  "notes"        text,
  "scheduled_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "logbook_entries_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL,
  CONSTRAINT "logbook_entries_entry_type_check"
    CHECK ((entry_type = ANY (ARRAY['inquiry'::text, 'viewing'::text, 'test_drive'::text, 'purchase'::text, 'follow_up'::text, 'note'::text]))),
  CONSTRAINT "logbook_entries_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL,
  CONSTRAINT "logbook_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "logbook_entries_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text, 'archived'::text]))),
  CONSTRAINT "logbook_entries_title_check" CHECK (((char_length(TRIM(BOTH FROM title)) >= 1) AND (char_length(TRIM(BOTH FROM title)) <= 200))),
  CONSTRAINT "logbook_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."logbook_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX logbook_user_created_idx ON public.logbook_entries USING btree (user_id, created_at DESC);

CREATE POLICY "Users can create their own logbook entries" ON "public"."logbook_entries"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can delete their own logbook entries" ON "public"."logbook_entries"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can read their own logbook entries" ON "public"."logbook_entries"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can update their own logbook entries" ON "public"."logbook_entries"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."logbook_entries" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."logbook_entries" TO "service_role";

REVOKE ALL ON TABLE "public"."logbook_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."logbook_entries" TO "postgres";
