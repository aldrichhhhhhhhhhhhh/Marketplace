# SELLSPACE Quick Account Setup v1

Status: implementation proposal — not yet applied to the live database.

## Scope

Implement the approved five-screen setup journey:

1. Welcome to SELLSPACE — Start Setup / Skip for Now.
2. Personal Information — full name, birth date, contact number, SMS verification.
3. Delivery Address — house/lot/block/unit, street, barangay, municipality/city, region, country, optional postal code.
4. Your Privacy Matters — links to Privacy Policy, Terms & Conditions, Community Rules; four mandatory acknowledgments.
5. Completion — show success only after all required server writes succeed.

Keep email/password authentication and email confirmation unchanged. Phone verification is a separate operation on the signed-in user's Auth account. Keep guest browsing and existing tab navigation.

## Current integration constraints

- Existing `profiles` columns are `id`, `display_name`, `avatar_url`, `phone`, timestamps. There is no birth-date, address, onboarding, or policy-acceptance model.
- Existing profile RLS is user-scoped.
- Supabase phone-change OTP requires phone auth/SMS provider configuration. The mobile flow should call `auth.updateUser({ phone })`, then verify with `auth.verifyOtp({ phone, token, type: 'phone_change' })`. This must be tested with the project's configured provider before enabling the step.
- Do not treat a client-side "verified" flag as proof. Verification must be checked against the authenticated Supabase user state.
- Existing email verification remains distinct.
- The corporate website policy URLs have not yet been verified. Do not invent URLs; use configured policy URL constants only after the real destinations are confirmed.
- The live project has five historical migration records, while this repository has no matching migration files. The SQL proposal is intentionally outside `supabase/migrations` until migration history is reconciled.

## Proposed persistence model

### `account_setup`
One row per auth user. Stores setup state and the time it was completed. RLS: user can read their own row. Client should not be able to set completion directly; finalization should be done by a narrowly scoped RPC that validates all prerequisites.

### `user_addresses`
One or more saved addresses per user, with fields:
- `id`, `user_id`
- `house_unit`, `street`, `barangay`, `city_municipality`, `region`, `country`
- nullable `postal_code`
- `is_default`, timestamps

RLS: user can select/insert/update/delete only their own addresses.

### `policy_acceptances`
Append-only acknowledgments with:
- `id`, `user_id`
- `policy_key` (eligibility_18_plus, terms, community_rules, privacy_notice)
- `policy_version`
- `accepted_at`

RLS: user may read their own records; client inserts must be constrained to their own user ID. No update/delete from ordinary client roles. Legal review must confirm whether the privacy acknowledgment is properly framed as notice acknowledgment versus consent and identify the applicable lawful basis.

### Profile fields
Persist the verified contact number in `profiles.phone`; store birth date in a dedicated protected field/table only if product/legal review confirms the need and retention policy. Do not expose birth date through public listing queries.

## Completion gate

A server-side finalization function should verify:
- caller is authenticated;
- caller's Supabase Auth user has a confirmed phone matching the submitted contact number;
- valid birth date and age >= 18 on the server;
- required address fields exist;
- all four required policy acknowledgments exist for the currently active policy versions;
- profile and address records are saved.

Only then set `account_setup.completed_at`. A failed operation must leave setup incomplete.

## Skip and resume

- Skipping is a local navigation choice only; it must not set completion.
- On each app launch, authenticated users with no completed setup are prompted again.
- An interrupted user resumes from saved server-side progress, or starts at the first incomplete step.
- A completed user is never automatically prompted again.
- Guest users are not forced through account setup.

## Acceptance criteria

- Existing sign-in/sign-up and email verification continue to work.
- SMS request/verification errors are shown with retry affordances.
- User cannot advance from Personal Information without verified phone and eligible age.
- User cannot complete with missing address fields or unchecked acknowledgments.
- The four checkboxes start unchecked.
- Continue is disabled until all four are checked.
- Completion is shown only after the server confirms all writes and finalization.
- Account owner can later edit their information and addresses.
- No production schema, Auth provider, or data is changed by this proposal.

## Not yet approved for production

- SMS provider and Philippine delivery/cost configuration.
- Policy destination URLs, policy versions, and legal wording.
- Birth-date retention and access policy.
- Reconciliation of historical migration files.
- Final SQL/RLS/RPC review and test plan.
