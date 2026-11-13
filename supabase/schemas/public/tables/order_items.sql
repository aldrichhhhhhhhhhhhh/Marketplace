CREATE TABLE "public"."order_items" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"     uuid                     NOT NULL,
  "product_id"   text                     NOT NULL,
  "product_name" text                     NOT NULL,
  "unit_price"   numeric(10,2)            NOT NULL,
  "quantity"     integer                  NOT NULL,
  "line_total"   numeric(10,2)            NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_items_check" CHECK ((line_total = (unit_price * (quantity)::numeric))),
  CONSTRAINT "order_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_items_product_name_check" CHECK (((length(TRIM(BOTH FROM product_name)) >= 1) AND (length(TRIM(BOTH FROM product_name)) <= 200))),
  CONSTRAINT "order_items_quantity_check" CHECK (((quantity > 0) AND (quantity <= 99))),
  CONSTRAINT "order_items_unit_price_check" CHECK ((unit_price >= (0)::numeric)),
  CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

ALTER TABLE "public"."order_items"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);

CREATE POLICY "Customers can read items from their own orders" ON "public"."order_items"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = ( SELECT auth.uid() AS uid))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "service_role";

REVOKE ALL ON TABLE "public"."order_items" FROM "authenticated";

GRANT SELECT ON TABLE "public"."order_items" TO "authenticated";

REVOKE ALL ON TABLE "public"."order_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "postgres";

REVOKE ALL ON TABLE "public"."order_items" FROM "anon";
