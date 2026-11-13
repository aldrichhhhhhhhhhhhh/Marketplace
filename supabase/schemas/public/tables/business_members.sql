CREATE TABLE "public"."business_members" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "business_id" uuid                     NOT NULL,
  "user_id"     uuid                     NOT NULL,
  "role"        text                     NOT NULL DEFAULT 'staff'::text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "business_members_business_id_user_id_key" UNIQUE (business_id, user_id),
  CONSTRAINT "business_members_pkey" PRIMARY KEY (id),
  CONSTRAINT "business_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text]))),
  CONSTRAINT "business_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "business_members_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE
);

ALTER TABLE "public"."business_members"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX business_members_user_id_idx ON public.business_members USING btree (user_id);

CREATE POLICY "Users can read their own business memberships" ON "public"."business_members"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."business_members" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."business_members" TO "service_role";

REVOKE ALL ON TABLE "public"."business_members" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."business_members" TO "postgres";
