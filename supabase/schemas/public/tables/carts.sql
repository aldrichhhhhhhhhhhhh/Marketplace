CREATE TABLE "public"."carts" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "carts_pkey" PRIMARY KEY (id),
  CONSTRAINT "carts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "carts_user_id_key" UNIQUE (user_id)
);

ALTER TABLE "public"."carts"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own carts" ON "public"."carts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can read their own carts" ON "public"."carts"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can update their own carts" ON "public"."carts"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."carts" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."carts" TO "service_role";

REVOKE ALL ON TABLE "public"."carts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."carts" TO "postgres";
