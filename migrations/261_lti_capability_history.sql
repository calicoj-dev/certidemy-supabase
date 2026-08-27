-- 261_lti_capability_history.sql
--
-- Five columns on lti_capabilities, a rewritten lti_record_capability, and a
-- RE-GRANT OF THE FULL COLUMN LIST.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-27, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes. Section 7 records the observed grant count and the function body
-- md5 verbatim.
--
-- ============================ THE RECORDER FAILED FIRST, AND WHY =========
--
-- CREATE OR REPLACE FUNCTION CANNOT REMOVE A PARAMETER DEFAULT.
--
-- 255 declared the last parameter `p_detail jsonb default null`. The first
-- version of section 6 wrote `p_detail jsonb` without it, and Postgres refused:
--
--   42P13  cannot remove parameter defaults from existing function
--   HINT   Use DROP FUNCTION public.lti_record_capability(uuid,uuid,text,
--          boolean,jsonb) first.
--
-- THAT HINT IS WRONG HERE AND MUST NOT BE FOLLOWED. Dropping and recreating
-- opens a window in which every capability write fails -- and those writes are
-- NON-FATAL BY DESIGN. lti-launch calls observe() and only console.warn()s on
-- error, precisely so a recording failure never costs a launch. So the window
-- would not surface as an outage. It would surface as nothing at all: launches
-- succeeding, capabilities silently not recorded, and no error anywhere.
--
-- A migration whose recommended path is a silent-failure window is the wrong
-- migration. Keeping the default is the fix, and it is the correct fix on its
-- own terms -- the signature is part of the contract, and 255 chose that
-- default deliberately so callers with nothing to record can omit it.
--
-- THE FAILURE ALSO PROVES THE md5 CHECK EARNS ITS KEEP. The refused statement
-- left 255's body in place, so the function existed, the name resolved, and
-- every caller kept working against the OLD recorder. Nothing was broken and
-- nothing said so. The only thing that caught it was section 7d returning
-- 6524b5903be5249cebc020587b9abad8 (540 bytes) -- 255's md5 -- where 261's was
-- expected. A no-op that reports no error is this codebase's recurring failure
-- mode, and a hash is what distinguishes it from success.
--
-- ============================ WHAT WAS WRONG =============================
--
-- lti_capabilities stored ONE value and a count that incremented on every
-- observation regardless of what was observed. So the row could not answer any
-- of the three questions worth asking:
--
--   has this ever been true?     -- a false row looks identical whether it was
--                                   always false or flipped this morning
--   how often?                   -- "3 of 4 launches released an email" is the
--                                   real observation for a value that varies
--                                   legitimately, and no single value carries it
--   when did it last change?     -- observed_at moves on every observation, so
--                                   it says when we last looked, not when
--                                   anything changed
--
-- observation_count counts the KEY, not the value. supports_deep_linking read
-- `true, 4` and nothing in the row said it had ever been false. The only
-- evidence of that change was a resource_link_unsupported skeleton row from an
-- hour earlier.
--
-- That is a gap in the place the variance architecture cares most: a Tier C
-- capability is written at runtime by the code that discovers a limitation, and
-- THE FLIP IS THE INTERESTING EVENT.
--
-- ============================ THE THREE KINDS OF KEY =====================
--
-- The eight keys the code writes are not one kind of thing, and this is why
-- counts beat a previous_value column on its own.
--
--   MONOTONIC EVIDENCE     supports_deep_linking
--     Once seen, never unseen. Latest-wins was actively WRONG here: lti-launch
--     wrote false on every resource-link launch and true on every deep-linking
--     one, so the value oscillated with whatever the instructor last clicked.
--     Fixed in the function, not here -- see section 8.
--
--   VARIES LEGITIMATELY    state_cookie_survives, releases_email,
--                          releases_name, custom_vars_substituted,
--                          advertises_link_content_item
--     Per launch, per browser, per user consent. A single value throws away
--     the only useful thing about them, which is the ratio.
--
--   STABLE PER PLATFORM    aud_is_array, omits_client_id_on_login
--     Latest-wins was fine. Counts cost nothing and stay consistent.
--
-- ============================ THE BACKFILL IS A RECONSTRUCTION ===========
--
-- AND IT IS WRONG ON A ROW WE CAN NAME.
--
-- Sections 3 splits observation_count onto whichever counter matches the
-- CURRENT value. That assumes the value never flipped, which is the best
-- available guess and is KNOWN FALSE for exactly one row:
--
--   platform "1EdTech reference TEST" (iss `certidemy`), key
--   supports_deep_linking, reading true / 4 as of 2026-08-27.
--
-- It was observed FALSE at 14:50:15 on a resource-link launch and TRUE on three
-- deep-linking launches after it. The backfill will record true_count 4,
-- false_count 0. The true history is 3 and 1.
--
-- Pre-261 history is not recoverable from these rows -- nothing stored it. The
-- reconstruction is kept because it is better than zeroing real observations,
-- and it is named here because a reconstruction nobody flags becomes a
-- measurement the next person trusts.
--
-- AND first_observed_at IS WRONG ON EVERY ROW, IN THE SAME WAY.
--
-- The backfill seeds it from observed_at, which is the LAST observation, not
-- the first -- that is all a single-timestamp column could ever have carried.
-- All six rows therefore read 2026-08-27 15:49:19, the final launch. The real
-- first observation was 14:50:15 for the five keys written on every launch.
--
-- So the column is honest FROM HERE FORWARD ONLY. On any row whose
-- first_observed_at predates 261 being applied, the value is an upper bound on
-- the true first sighting, not a record of it. A row created after 261 is
-- correct, because the insert sets it once and section 6 never updates it.
--
-- ============================ THE GRANT TRAP =============================
--
-- 256 granted SEVEN NAMED COLUMNS on this table, deliberately withholding
-- last_detail. A column-scoped grant does not extend to columns added later, so
-- the five columns below arrive with NO GRANT AT ALL.
--
-- And lib/console/lti.ts is FAILURE-TOLERANT: a query error degrades to an
-- empty section rather than throwing, because a console page should render thin
-- and never 500. So a forgotten grant here does not produce an error anywhere.
-- It produces an LTI page with no capabilities on it, silently, which is the
-- exact silent-success shape this codebase keeps paying for.
--
-- Section 5 re-grants the FULL list -- old columns and new -- rather than only
-- the additions. Section 7 verifies by COUNTING GRANTED COLUMNS, not by reading
-- the statement back.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: add column if not exists, create or replace, re-runnable grants.

-- ---------------------------------------------------------------------------
-- 1. Before. Record what the six existing rows look like, so the backfill can
--    be checked against something.
-- ---------------------------------------------------------------------------

-- select key, value, observation_count from public.lti_capabilities order by key;
--
-- OBSERVED 2026-08-27:
--   accepts_link_content_item  (no row)
--   aud_is_array               false  4
--   custom_vars_substituted    true   4
--   releases_email             true   4
--   releases_name              true   4
--   state_cookie_survives      true   4
--   supports_deep_linking      true   4

-- ---------------------------------------------------------------------------
-- 2. The columns. Nullable first; first_observed_at is tightened in section 4
--    AFTER the backfill, so no row is ever briefly wrong.
-- ---------------------------------------------------------------------------

alter table public.lti_capabilities
  add column if not exists true_count integer not null default 0;

alter table public.lti_capabilities
  add column if not exists false_count integer not null default 0;

alter table public.lti_capabilities
  add column if not exists first_observed_at timestamptz;

alter table public.lti_capabilities
  add column if not exists changed_at timestamptz;

alter table public.lti_capabilities
  add column if not exists previous_value text;

-- ---------------------------------------------------------------------------
-- 3. Backfill. A RECONSTRUCTION -- see the header, including the row it gets
--    wrong.
--
--    changed_at and previous_value stay NULL. We do not know when anything
--    changed, and inventing a timestamp would be worse than admitting that.
-- ---------------------------------------------------------------------------

update public.lti_capabilities
set true_count        = case when value = 'true'  then observation_count else 0 end,
    false_count       = case when value = 'false' then observation_count else 0 end,
    first_observed_at = coalesce(first_observed_at, observed_at)
where first_observed_at is null;

-- ---------------------------------------------------------------------------
-- 4. Now it can be NOT NULL.
-- ---------------------------------------------------------------------------

alter table public.lti_capabilities
  alter column first_observed_at set default now();

alter table public.lti_capabilities
  alter column first_observed_at set not null;

-- ---------------------------------------------------------------------------
-- 5. THE FULL COLUMN LIST. Twelve of thirteen. last_detail stays withheld for
--    the reason 256 gives: it is the one column with unbounded content that
--    future code writes into, and the console needs none of it.
--
--    Re-granting the whole list rather than only the additions is deliberate.
--    A grant naming five columns would leave this file describing a partial
--    truth, and the next person adding a column would copy the partial form.
-- ---------------------------------------------------------------------------

grant select (id, platform_id, deployment_id, key, value,
              observation_count, observed_at,
              true_count, false_count, first_observed_at,
              changed_at, previous_value)
  on public.lti_capabilities to authenticated;

-- ---------------------------------------------------------------------------
-- 6. The recorder.
--
--    THE COMPARISON IS AGAINST excluded.value, NOT p_value. Both would work,
--    but excluded.value is the same expression the insert used, so the counter
--    and the change-detection can never disagree about what was observed.
--
--    first_observed_at is absent from the update list ON PURPOSE. It is the one
--    timestamp here that must never move.
--
--    `p_detail jsonb default null` KEEPS ITS DEFAULT, and dropping it is what
--    made the first attempt fail with 42P13. See the header: the hint to DROP
--    FUNCTION must not be followed, because these writes are non-fatal and the
--    window would be silent.
-- ---------------------------------------------------------------------------

create or replace function public.lti_record_capability(
  p_platform_id   uuid,
  p_deployment_id uuid,
  p_key           text,
  p_value         boolean,
  p_detail        jsonb default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.lti_capabilities as c
    (platform_id, deployment_id, key, value, last_detail,
     true_count, false_count)
  values
    (p_platform_id, p_deployment_id, p_key,
     case when p_value then 'true' else 'false' end, p_detail,
     case when p_value then 1 else 0 end,
     case when p_value then 0 else 1 end)
  on conflict (platform_id, coalesce(deployment_id, '00000000-0000-0000-0000-000000000000'::uuid), key)
  do update set
    value             = excluded.value,
    last_detail       = coalesce(excluded.last_detail, c.last_detail),
    observed_at       = now(),
    observation_count = c.observation_count + 1,
    true_count        = c.true_count  + case when excluded.value = 'true'  then 1 else 0 end,
    false_count       = c.false_count + case when excluded.value = 'false' then 1 else 0 end,
    previous_value    = case when c.value is distinct from excluded.value
                             then c.value else c.previous_value end,
    changed_at        = case when c.value is distinct from excluded.value
                             then now() else c.changed_at end;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 7. Verification. Run all four.
-- ---------------------------------------------------------------------------

-- 7a. THE GRANT, BY COUNT. This is the one that matters -- see the header.
--     Expect granted = 12 and ungranted = 1 (last_detail).
--
-- select count(*) filter (where attacl is not null) as granted,
--        count(*) filter (where attacl is null)     as ungranted
-- from pg_attribute
-- where attrelid = 'public.lti_capabilities'::regclass
--   and attnum > 0 and not attisdropped;
--
-- OBSERVED 2026-08-27:  granted 12, ungranted 1

-- 7b. The one column that must still be ungranted.
--
-- select attname from pg_attribute
-- where attrelid = 'public.lti_capabilities'::regclass
--   and attnum > 0 and not attisdropped and attacl is null;
--
-- OBSERVED 2026-08-27:  last_detail, alone

-- 7c. The backfill. Every row must have true_count + false_count =
--     observation_count, and a first_observed_at.
--
-- select key, value, observation_count, true_count, false_count,
--        first_observed_at, changed_at, previous_value
-- from public.lti_capabilities order by key;
--
-- OBSERVED 2026-08-27 -- 6 rows, first_observed_at 2026-08-27 15:49:19.x on
-- every one of them, changed_at and previous_value null on every one:
--
--   key                      value  obs  true  false
--   aud_is_array             false   4     0     4
--   custom_vars_substituted  true    4     4     0
--   releases_email           true    4     4     0
--   releases_name            true    4     4     0
--   state_cookie_survives    true    4     4     0
--   supports_deep_linking    true    4     4     0
--
-- true_count + false_count = observation_count on all six.
--
-- THE TWO KNOWN-WRONG READINGS IN THAT TABLE, both predicted, both recorded
-- rather than left to be rediscovered:
--
--   supports_deep_linking reads 4 / 0. THE TRUTH IS 3 TRUE AND 1 FALSE. It was
--   observed false at 14:50:15 on the resource-link launch and true on the
--   three deep-linking launches after it. The backfill splits on the CURRENT
--   value and therefore assumes no flip ever happened, which is false for
--   exactly this row.
--
--   first_observed_at reads 15:49:19 on ALL SIX. That is the LAST observation,
--   not the first -- see section 3. The real first sighting was 14:50:15 for
--   the five keys written on every launch.

-- 7d. The function body md5, CRs stripped.
--
-- select md5(replace(prosrc, chr(13), '')), length(replace(prosrc, chr(13), ''))
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname = 'lti_record_capability';
--
-- OBSERVED 2026-08-27:  858d3699228ae1730580ebaa05f6c9eb  1122
--
-- AND WHAT IT RETURNED ON THE FAILED FIRST ATTEMPT:
--   6524b5903be5249cebc020587b9abad8  540
-- which is 255's body, still in place after the 42P13 refusal. See the header.
-- The signature was verified too:
--
-- select pg_get_function_arguments(p.oid)
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname = 'lti_record_capability';
--
-- OBSERVED:  p_platform_id uuid, p_deployment_id uuid, p_key text,
--            p_value boolean, p_detail jsonb DEFAULT NULL::jsonb

-- ---------------------------------------------------------------------------
-- 8. Deployed alongside, 2026-08-27. Both are in this migration's debt.
--
--    functions/lti-launch
--      supports_deep_linking BECOMES MONOTONIC. It is written only when the
--      launch IS a deep-linking request, never with false. It now means
--      "we have seen this platform do deep linking at least once" and it
--      never returns to false. A platform that stops supporting deep linking
--      is a re-registration, not a flip.
--
--      Before this, a resource-link launch wrote false and a deep-linking
--      launch wrote true, so the value tracked whatever the instructor last
--      clicked. The lti-ri row read true only because the last three launches
--      happened to be deep-linking; one more resource-link launch would have
--      made the console say "No" for a platform proven to support it.
--
--      advertises_link_content_item IS RECORDED HERE, once per launch, from
--      deep_linking_settings.accept_types. Absent accept_types records
--      NOTHING -- a platform that did not advertise is unobserved, not false.
--
--    functions/lti-deep-link
--      The key it wrote, accepts_link_content_item, IS RENAMED. It had zero
--      rows, so the rename cost nothing and will never be cheaper.
--
--      THE OLD NAME CLAIMED SOMETHING WE CAN NEVER KNOW. Deep linking has no
--      callback: we sign, the browser redirects, and the platform decides at
--      its own end. We learned lti-ri accepted our content item by reading
--      their web page. Nothing about acceptance reaches us, so no honest
--      `true` could ever mean "the platform took it". The most any value here
--      can mean is what the platform ADVERTISED, and the name now says so.
--
--      The refusal write stays in the sign action. A platform that did not
--      advertise link and got refused is a real event, observed at the moment
--      it mattered.
-- ---------------------------------------------------------------------------
