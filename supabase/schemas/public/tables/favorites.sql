CREATE TABLE "public"."favorites" (
  "user_id"    uuid                     NOT NULL,
  "listing_id" uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "favorites_pkey" PRIMARY KEY (user_id, listing_id),
  CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "favorites_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE
);

ALTER TABLE "public"."favorites"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX favorites_listing_id_idx ON public.favorites USING btree (listing_id);

CREATE POLICY "Users can add their own favorites" ON "public"."favorites"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can read their own favorites" ON "public"."favorites"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can remove their own favorites" ON "public"."favorites"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorites" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorites" TO "service_role";

REVOKE ALL ON TABLE "public"."favorites" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorites" TO "postgres";
