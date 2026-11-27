-- SELLSPACE: least-privilege public API grants.
-- Prepared 2026-11-27. Review and test on an isolated database before production.
-- This migration only narrows unsafe client privileges and future defaults.
-- It does not change RLS, authenticated business workflows, Storage, or Auth settings.

begin;

-- Anonymous access is limited to public marketplace discovery. RLS still
-- restricts these SELECTs to active listings and their public media.
revoke all privileges on all tables in schema public from anon;
grant select on table public.listings, public.listing_media to anon;

-- RLS does not govern TRUNCATE, REFERENCES, TRIGGER, or MAINTAIN privileges.
-- Authenticated clients do not need any of these capabilities.
revoke truncate, references, trigger, maintain
on all tables in schema public
from authenticated;

-- Application tables currently use UUID primary keys/defaults. Remove direct
-- sequence access from client roles; future sequence grants must be explicit.
revoke all privileges on all sequences in schema public from anon, authenticated;

-- This function is a trigger callback, not an RPC. Remove direct and inherited
-- client EXECUTE while retaining the existing service_role grant.
revoke execute on function public.set_marketplace_order_updated_at()
from public, anon, authenticated;

-- All 17 current application tables are owned by postgres. New application
-- tables created by postgres in public must receive no implicit client access.
-- Each migration must grant only the operations required by its RLS policies.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated;

-- Future public functions are not callable by client roles unless an explicit
-- grant is included in their reviewed migration.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

commit;
