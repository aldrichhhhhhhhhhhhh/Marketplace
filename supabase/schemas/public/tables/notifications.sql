CREATE TABLE "public"."notifications" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"           uuid                     NOT NULL,
  "title"             text                     NOT NULL,
  "body"              text,
  "notification_type" text                     NOT NULL DEFAULT 'general'::text,
  "data"              jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "read_at"           timestamp with time zone,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notifications_pkey" PRIMARY KEY (id),
  CONSTRAINT "notifications_title_check" CHECK (((char_length(TRIM(BOTH FROM title)) >= 1) AND (char_length(TRIM(BOTH FROM title)) <= 160))),
  CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."notifications"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX notifications_user_created_idx ON public.notifications USING btree (user_id, created_at DESC);

CREATE POLICY "Users can read their own notifications" ON "public"."notifications"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can update their own notifications" ON "public"."notifications"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "service_role";

REVOKE ALL ON TABLE "public"."notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "postgres";
