CREATE TABLE "public"."profiles" (
  "id"           uuid                     NOT NULL,
  "display_name" text,
  "avatar_url"   text,
  "phone"        text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_display_name_check"
    CHECK (((display_name IS NULL) OR ((char_length(TRIM(BOTH FROM display_name)) >= 1) AND (char_length(TRIM(BOTH FROM display_name)) <= 120)))),
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own profile" ON "public"."profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can read their own profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";
