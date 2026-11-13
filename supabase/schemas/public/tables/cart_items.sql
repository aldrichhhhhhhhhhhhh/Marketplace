CREATE TABLE "public"."cart_items" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "cart_id"    uuid                     NOT NULL,
  "listing_id" uuid                     NOT NULL,
  "quantity"   integer                  NOT NULL DEFAULT 1,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "cart_items_cart_id_listing_id_key" UNIQUE (cart_id, listing_id),
  CONSTRAINT "cart_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "cart_items_quantity_check" CHECK (((quantity >= 1) AND (quantity <= 99))),
  CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE,
  CONSTRAINT "cart_items_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."cart_items"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX cart_items_cart_id_idx ON public.cart_items USING btree (cart_id);

CREATE POLICY "Users can add items to their own carts" ON "public"."cart_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Users can read their own cart items" ON "public"."cart_items"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Users can remove items from their own carts" ON "public"."cart_items"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Users can update items in their own carts" ON "public"."cart_items"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_items" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_items" TO "service_role";

REVOKE ALL ON TABLE "public"."cart_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_items" TO "postgres";
