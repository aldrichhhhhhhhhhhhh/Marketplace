CREATE OR REPLACE FUNCTION private.is_business_member (
  target_business_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = (select auth.uid())
  );
$function$;

GRANT EXECUTE ON FUNCTION "private"."is_business_member"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "private"."is_business_member"(uuid) FROM PUBLIC;
