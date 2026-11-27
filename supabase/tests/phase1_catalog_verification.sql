-- Read-only Phase 1 catalog verification.
-- Run only AFTER migrations 20261127000100, 00200 and 00300 are applied
-- to an isolated test database. This does not test row-level behavior; use the
-- identity-based test matrix in business_listing_authorization_test_plan.md.
-- Every result row should have passed = true.

with
public_tables as (
  select c.oid, c.relname
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
),
checks as (
  select
    'anon_select_listings'::text as check_name,
    has_table_privilege('anon', 'public.listings', 'SELECT')
      and has_table_privilege('anon', 'public.listing_media', 'SELECT')
      as passed,
    'anon must retain public browse SELECT on listings and listing_media'::text as detail

  union all
  select
    'anon_no_write_or_private_table_access',
    coalesce(bool_and(
      not has_table_privilege('anon', oid, 'INSERT')
      and not has_table_privilege('anon', oid, 'UPDATE')
      and not has_table_privilege('anon', oid, 'DELETE')
      and (relname in ('listings', 'listing_media')
        or not has_table_privilege('anon', oid, 'SELECT'))
    ), false),
    'anon must have no writes and SELECT only on listings/listing_media'

  union all
  select
    'authenticated_no_unsafe_table_privileges',
    coalesce(bool_and(
      not has_table_privilege('authenticated', oid, 'TRUNCATE')
      and not has_table_privilege('authenticated', oid, 'REFERENCES')
      and not has_table_privilege('authenticated', oid, 'TRIGGER')
      and not has_table_privilege('authenticated', oid, 'MAINTAIN')
    ), false),
    'authenticated must not have TRUNCATE/REFERENCES/TRIGGER/MAINTAIN on public tables'

  union all
  select
    'notifications_read_marker_only',
    has_column_privilege('authenticated', 'public.notifications', 'read_at', 'UPDATE')
      and not has_column_privilege('authenticated', 'public.notifications', 'title', 'UPDATE')
      and not has_column_privilege('authenticated', 'public.notifications', 'body', 'UPDATE')
      and not has_table_privilege('authenticated', 'public.notifications', 'UPDATE'),
    'authenticated may update read_at only, subject to own-row RLS'

  union all
  select
    'business_moderation_fields_protected',
    has_column_privilege('authenticated', 'public.businesses', 'owner_id', 'INSERT')
      and has_column_privilege('authenticated', 'public.businesses', 'name', 'UPDATE')
      and not has_column_privilege('authenticated', 'public.businesses', 'status', 'INSERT')
      and not has_column_privilege('authenticated', 'public.businesses', 'status', 'UPDATE')
      and not has_column_privilege('authenticated', 'public.businesses', 'owner_id', 'UPDATE'),
    'client may create own pending workspace and update allowed profile fields only'

  union all
  select
    'business_membership_writes_blocked',
    not has_table_privilege('authenticated', 'public.business_members', 'INSERT')
      and not has_table_privilege('authenticated', 'public.business_members', 'UPDATE')
      and not has_table_privilege('authenticated', 'public.business_members', 'DELETE'),
    'membership lifecycle remains backend-only'

  union all
  select
    'trigger_function_not_client_callable',
    not has_function_privilege('anon', 'public.set_marketplace_order_updated_at()', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.set_marketplace_order_updated_at()', 'EXECUTE'),
    'trigger-only function must not be exposed as a client RPC'

  union all
  select
    'business_owner_helpers',
    to_regprocedure('private.is_business_member(uuid)') is not null
      and to_regprocedure('private.is_business_owner(uuid)') is not null
      and has_function_privilege('authenticated', 'private.is_business_member(uuid)', 'EXECUTE')
      and has_function_privilege('authenticated', 'private.is_business_owner(uuid)', 'EXECUTE')
      and not has_function_privilege('anon', 'private.is_business_member(uuid)', 'EXECUTE')
      and not has_function_privilege('anon', 'private.is_business_owner(uuid)', 'EXECUTE'),
    'RLS helper functions exist with authenticated-only execution'

  union all
  select
    'listing_identity_guard',
    exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'listings'
        and t.tgname = 'listings_guard_workspace_identity'
        and not t.tgisinternal
    ),
    'seller_id and business_id changes are guarded for authenticated client sessions'

  union all
  select
    'location_schema_preserved',
    (
      select count(*) = 4
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'listings'
        and column_name in ('location_address', 'latitude', 'longitude', 'location_source')
    ),
    'all four live listing-location columns must remain present'

  union all
  select
    'postgres_public_default_acl_is_least_privilege',
    not exists (
      select 1
      from pg_default_acl d
      join pg_namespace n on n.oid = d.defaclnamespace
      join pg_roles owner_role on owner_role.oid = d.defaclrole
      where n.nspname = 'public'
        and owner_role.rolname = 'postgres'
        and exists (
          select 1
          from aclexplode(d.defaclacl) a
          where a.grantee in (
            0,
            (select oid from pg_roles where rolname = 'anon'),
            (select oid from pg_roles where rolname = 'authenticated')
          )
        )
    ),
    'postgres-owned future public objects must not default-grant clients or PUBLIC'
)
select check_name, passed, detail
from checks
order by check_name;
