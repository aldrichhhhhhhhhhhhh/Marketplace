# Business Listing Authorization — Isolated Test Plan

**Migration under test:** `20261127000100_harden_business_listing_authorization.sql`  
**Follow-up grants migration:** `20261127000200_least_privilege_public_grants.sql`  
**Workflow-field migration:** `20261127000300_harden_client_workflow_fields.sql`  
**Target:** isolated Supabase branch or disposable project only. Never seed these test identities or run mutation tests against production.

## Preconditions

1. Restore a fresh isolated database from the reviewed Phase 0 schema baseline, including the live listing-location columns and constraints.
2. Apply only the ledgered migrations required to reach the baseline, then apply migration 001 and 002 in timestamp order.
3. Create disposable Auth users through the Auth admin API and record their UUIDs:
   - `owner_a`: owner of Business A, deliberately no `business_members` row (tests legacy owner compatibility).
   - `seller_a`: staff member of Business A.
   - `seller_b`: admin member of Business A.
   - `outsider_c`: member of Business B only.
   - `personal_d`: no business membership.
   - `buyer_e`: buyer only.
4. Create Business A and Business B, memberships for seller_a/seller_b in A and outsider_c in B, and sample personal/business listings owned by the relevant identities.
5. Use authenticated requests carrying each user's real JWT. Do not simulate access by connecting as postgres; postgres bypasses RLS.

## Required positive tests

| Actor | Action | Expected |
|---|---|---|
| personal_d | Create personal listing with `business_id=NULL`, `seller_id=personal_d` | Allowed |
| seller_a | Create listing in Business A with `seller_id=seller_a` and `status='draft'` | Allowed |
| seller_b | Create listing in Business A with `seller_id=seller_b` | Allowed |
| owner_a (no membership row) | Read Business A listings | Allowed |
| owner_a (no membership row) | Create own listing in Business A | Allowed |
| seller_a | Read active public listings and active public media | Allowed |
| seller_a | Read Business A draft listings/media | Allowed |
| outsider_c | Read own Business B listings | Allowed |
| seller_a | Update own Business A listing fields (title, price, status) | Allowed |
| seller_a | Activate own draft after media upload | Allowed |
| owner_a | Create a business workspace with default `status='pending'` | Allowed |
| owner_a | Update allowed business profile fields | Allowed |
| seller_a | Update only `notifications.read_at` on own notification | Allowed |
| buyer_e | Insert an appointment with `status='requested'` | Allowed |
| owner_a | Update Business A listing fields without changing its seller/workspace | Allowed |
| seller_a | Update own personal listing | Allowed |
| anon | Read active listings and active listing media only | Allowed |

## Required negative tests

| Actor | Attempt | Expected |
|---|---|---|
| anon | Read profiles, businesses, business_members, carts, addresses, orders, appointments, notifications | Denied/no rows |
| anon | Insert/update/delete any application row | Permission denied |
| seller_a | Update seller_b's Business A listing | Denied |
| seller_a | Delete seller_b's Business A listing | Denied |
| seller_a | Change seller_b listing's `seller_id` to seller_a | Denied |
| seller_a | Detach seller_b listing by setting `business_id=NULL` | Denied |
| seller_a | Move a listing from Business A to Business B | Denied |
| outsider_c | Read/update/delete Business A listing | Denied |
| seller_a | Create a listing in Business B | Denied |
| seller_a | Insert a listing with `status='active'` directly | Denied |
| owner_a | Create a business with `status='active'` supplied by client | Denied |
| owner_a | Change business `status` or `owner_id` from client | Denied |
| seller_a | Insert/update/delete business_members directly | Denied |
| buyer_e | Insert appointment with `status='confirmed'` | Denied |
| buyer_e | Change notification title/body/type/data | Denied |
| personal_d | Create a listing attributed to another user's seller_id | Denied |
| seller_a | Create a business listing with a different seller_id | Denied |
| seller_a | Continue editing Business A listing after membership revocation | Denied |
| buyer_e | Read another user's private data | Denied |

## Storage-specific checks

The existing Storage path contract is `{auth.uid()}/{listing_id}/{sequence}-{safeName}.{ext}`. Keep these checks separate from SQL listing policy tests:

- seller_a can upload to a listing they created and the path starts with seller_a's UUID.
- seller_a cannot upload into seller_b's listing path.
- seller_a cannot overwrite an existing object (`upsert=false`) or delete seller_b's object.
- business membership alone does not grant Storage access to another seller's files.
- public object retrieval remains consistent with the current public bucket behavior until a separately reviewed private-bucket migration is approved.
- Deleting a listing by its business owner must trigger an explicit orphan-object cleanup workflow; SQL row cascade does not itself remove Storage objects.

## Privilege verification after migration 002

Inspect `information_schema.role_table_grants`, `pg_class.relacl`, and `has_table_privilege`:

- anon has only SELECT on `public.listings` and `public.listing_media`, no privileges on other public application tables.
- authenticated has no TRUNCATE, REFERENCES, TRIGGER, or MAINTAIN on any public application table.
- service_role and postgres retain their intended operational privileges.
- anon/authenticated have no sequence privileges in public.
- anon/authenticated/PUBLIC cannot execute the trigger-only `public.set_marketplace_order_updated_at()`.
- `authenticated` and `service_role` can execute `public.finalize_account_setup()`; anon cannot.
- Future objects created by postgres in public receive no implicit table, sequence, or function access for anon/authenticated/PUBLIC.
- No default ACLs owned by `supabase_admin` or other platform roles are modified by these migrations.

## Regression checks

- Verify all four live listing-location fields and their existing CHECK constraints are unchanged.
- Verify personal listing create/publish still works.
- Verify mobile image upload, media-row insert, listing activation, and compensating cleanup.
- Verify public guest marketplace browse and image display.
- Verify all subscription tiers have the same ability to create a listing; no tier or membership role is referenced by the authorization predicate.
- Re-run Supabase Security and Performance Advisors and inspect every new finding.

## Rollback

On the isolated test branch, reset the branch to the pre-migration snapshot and rerun the tests. For production, use the separately prepared rollback migration based on the exact preflight policy/grant snapshot; do not reverse by dropping columns or deleting application rows.
