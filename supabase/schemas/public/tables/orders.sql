CREATE TABLE "public"."orders" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_number"    text                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "recipient_name"  text                     NOT NULL,
  "phone"           text                     NOT NULL,
  "address"         text                     NOT NULL,
  "city"            text                     NOT NULL,
  "postal_code"     text                     NOT NULL,
  "subtotal"        numeric(10,2)            NOT NULL,
  "delivery_fee"    numeric(10,2)            NOT NULL,
  "total"           numeric(10,2)            NOT NULL,
  "payment_method"  text                     NOT NULL DEFAULT 'cod'::text,
  "payment_status"  text                     NOT NULL DEFAULT 'unpaid'::text,
  "status"          text                     NOT NULL DEFAULT 'pending'::text,
  "idempotency_key" uuid                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "orders_address_check" CHECK (((length(TRIM(BOTH FROM address)) >= 3) AND (length(TRIM(BOTH FROM address)) <= 500))),
  CONSTRAINT "orders_check" CHECK ((total = (subtotal + delivery_fee))),
  CONSTRAINT "orders_city_check" CHECK (((length(TRIM(BOTH FROM city)) >= 2) AND (length(TRIM(BOTH FROM city)) <= 120))),
  CONSTRAINT "orders_delivery_fee_check" CHECK ((delivery_fee >= (0)::numeric)),
  CONSTRAINT "orders_order_number_key" UNIQUE (order_number),
  CONSTRAINT "orders_payment_method_check" CHECK ((payment_method = 'cod'::text)),
  CONSTRAINT "orders_payment_status_check" CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'paid'::text, 'refunded'::text]))),
  CONSTRAINT "orders_phone_check" CHECK (((length(TRIM(BOTH FROM phone)) >= 7) AND (length(TRIM(BOTH FROM phone)) <= 30))),
  CONSTRAINT "orders_pkey" PRIMARY KEY (id),
  CONSTRAINT "orders_postal_code_check" CHECK (((length(TRIM(BOTH FROM postal_code)) >= 2) AND (length(TRIM(BOTH FROM postal_code)) <= 20))),
  CONSTRAINT "orders_recipient_name_check" CHECK (((length(TRIM(BOTH FROM recipient_name)) >= 1) AND (length(TRIM(BOTH FROM recipient_name)) <= 120))),
  CONSTRAINT "orders_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text]))),
  CONSTRAINT "orders_subtotal_check" CHECK ((subtotal >= (0)::numeric)),
  CONSTRAINT "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT "orders_user_id_idempotency_key_key" UNIQUE (user_id, idempotency_key)
);

ALTER TABLE "public"."orders"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX orders_user_created_at_idx ON public.orders USING btree (user_id, created_at DESC);

CREATE TRIGGER set_marketplace_order_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_marketplace_order_updated_at();

CREATE POLICY "Customers can read their own orders" ON "public"."orders"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "service_role";

REVOKE ALL ON TABLE "public"."orders" FROM "authenticated";

GRANT SELECT ON TABLE "public"."orders" TO "authenticated";

REVOKE ALL ON TABLE "public"."orders" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "postgres";

REVOKE ALL ON TABLE "public"."orders" FROM "anon";
