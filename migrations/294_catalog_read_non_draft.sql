-- 294: the catalogue read policy stops meaning 'available' and starts meaning 'not draft'
--
-- ONE PASTE. Pre- AND post-conditions ABORT; only the final select prints.
--
-- RUN 293 FIRST. It is not optional and it is not merely tidy: this migration
-- publishes SM-AI-II's exam_blueprint, and until 293 runs that blueprint names
-- repository internals. The pre-condition below refuses to proceed without it.
--
-- ============================================================================
-- WHY
-- ============================================================================
--
-- SM-AI-II is 'coming_soon' and invisible on /certifications, because the
-- catalogue policy reads:
--
--   catalog read certifications   SELECT   PUBLIC   (status = 'available' OR is_platform_admin())
--
-- 'coming_soon' therefore renders nowhere. The status vocabulary already has
-- four values and the catalogue understood only one of them, so a certification
-- could be announced only by being finished.
--
-- THE DECISION IS FOR EVERY CERTIFICATION, NOT THIS ONE: the catalogue shows
-- everything that is not a draft. 'draft' is the only value that means "this is
-- not a real certification yet".
--
-- WHAT ELSE THIS OPENS, MEASURED 2026-09-11 RATHER THAN ASSUMED:
--
--   coming_soon   1 row    SM-AI-II - the intended effect
--   unavailable   0 rows   opens as a CLASS, with no members today
--   draft         1 row    ZZ-TEST-I "Internal Exam Path Test" - STAYS HIDDEN
--
-- The 'unavailable' class is the part worth stating out loud, because it is a
-- consequence nobody asked for: a withdrawn or suspended certification becomes
-- anon-readable under this policy. That is arguably right - a credential people
-- hold should not vanish from the catalogue when it stops being sold - but it
-- is a decision this migration makes silently unless it is written down, so it
-- is written down. Zero rows today; the first 'unavailable' certification will
-- be public from the moment it is set.
--
-- WHAT DOES **NOT** FOLLOW FROM A CERT ROW BECOMING READABLE:
--
--   No policy anywhere in this database references certifications.status in a
--   subquery. Checked across all 54 policies on all 48 tables. So nothing else
--   becomes readable as a CONSEQUENCE of this row becoming readable - there is
--   no chain. domains and tasks already carry `qual: true` SELECT policies and
--   have been world-readable for every certification, drafts included, all
--   along. This migration does not widen them and does not need to.
--
--   exam_blueprint IS THE ONE THING THAT GENUINELY GOES PUBLIC HERE, and only
--   because it is a COLUMN on this table: anon holds `anon=r/postgres`, a
--   table-wide SELECT with no column-level privileges (relacl, checked). There
--   is no state in which the catalogue card renders and the blueprint does not.
--   That is what 293 is for, and the pre-condition enforces the ordering.
--
-- ============================================================================
-- BEHAVIOUR, NOT POLICY TEXT
-- ============================================================================
--
-- The question is not "what does the policy say", it is "what can an anonymous
-- reader actually select". Those are different questions and only the second is
-- the thing being changed. SET LOCAL ROLE answers it exactly: anon is a real
-- role with a real grant, and RLS applies to it because it is not the table
-- owner and holds no BYPASSRLS.
--
-- BOTH CHECKS RUN INSIDE THE TRANSACTION THAT ALTERS THE POLICY, so a wrong
-- outcome raises and the ALTER rolls back with it. The paste reverts itself.
-- The temp table exists only to carry the measured values across the role
-- reset and out to a single readable result set.
--
-- THE WRITE PATH IS DELIBERATELY NOT TESTED BY BEHAVIOUR, and the reason is
-- migration 246: it shipped a commented `drop trigger ... on auth.users` as an
-- "expect 42501" verification, the drop SUCCEEDED instead of failing, and
-- signup was silently dead until the trigger was recreated. WHEN THE CHECK AND
-- THE DAMAGE ARE THE SAME ACTION, THE CHECK IS THE DAMAGE. An anon INSERT run
-- to prove anon cannot insert writes a row on the day the assumption is wrong,
-- which is precisely the day you are running the check. The write path is
-- asserted against pg_policy instead: three policies, and the altered one still
-- polcmd 'r'.
--
-- IF IT ABORTS ON "permission denied to set role anon": you are connected as a
-- role that is not a member of anon. The SQL editor's postgres role is. Do not
-- substitute a check that evaluates the policy expression against rows by hand
-- - that tests the sentence, not the system, and the two have disagreed before.
--
-- IF THE FINAL SELECT SAYS _v294 DOES NOT EXIST: the transaction aborted and
-- nothing was changed. Scroll up and read the raised message.

begin;

drop table if exists pg_temp._v294;   -- pg_temp-qualified: a bare name would
                                      -- resolve through search_path and could
                                      -- reach a real table called _v294.
create temp table _v294 (ord int, check_name text, actual text, expected text);

-- --- PRE-CONDITIONS. These abort; they do not report. ----------------------
do $pre$
declare
  dirty    int;
  notelen  int;
  visible  int;
  sees_sm  boolean;
  sees_zz  boolean;
  avail    int;
begin
  -- 293 has run. This migration publishes that text.
  select count(*) filter (where exam_blueprint::text ~ '\.mjs|\.ts|HANDOFF|migration [0-9]|scripts/|verify-cert')
    into dirty from public.certifications;
  if dirty <> 0 then
    raise exception using
      message = 'run 294 only after 293',
      detail  = format('%s blueprint(s) still name repository internals', dirty),
      hint    = 'this migration publishes SM-AI-II exam_blueprint';
  end if;

  -- CRs stripped, as 244, 245 and 249 do: a browser paste normalises newlines
  -- and a raw length check measures the transport rather than the content.
  select length(replace(exam_blueprint->'item_model'->>'grounding_note', chr(13), ''))
    into notelen from public.certifications where code = 'SM-AI-II';
  if notelen <> 1846 then
    raise exception using
      message = 'SM-AI-II grounding_note is not the note 293 wrote',
      detail  = format('length %s with CRs stripped, expected 1846', notelen),
      hint    = 'do not publish a note nobody has read';
  end if;

  -- BEHAVIOUR BEFORE. All four, because they are four different assertions.
  execute 'set local role anon';
  select count(*), bool_or(code = 'SM-AI-II'), bool_or(code = 'ZZ-TEST-I'),
         count(*) filter (where status = 'available')
    into visible, sees_sm, sees_zz, avail
    from public.certifications;
  execute 'reset role';

  if visible <> 11 or sees_sm or sees_zz or avail <> 11 then
    raise exception using
      message = 'the catalogue is not in the state 294 was written against',
      detail  = format('anon sees %s (expect 11), sm %s (f), zz %s (f), available %s (11)',
                       visible, sees_sm, sees_zz, avail),
      hint    = 'already applied, or a status moved - investigate first';
  end if;
end
$pre$;

-- --- THE CHANGE. One statement. -------------------------------------------
-- ALTER POLICY, not DROP + CREATE. The policy keeps its name, its command (r)
-- and its PUBLIC role list; only the qualifier moves. DROP + CREATE would leave
-- a window with no catalogue policy at all, and would silently re-derive the
-- role list from whatever the CREATE happened to say.
--
-- status is NOT NULL with a CHECK over exactly four values
-- (draft, coming_soon, available, unavailable), so `<>` is total here: there is
-- no NULL row to fall through it. That was checked, not assumed - a nullable
-- status would need `is distinct from` and would silently hide every NULL row.
alter policy "catalog read certifications"
  on public.certifications
  using (status <> 'draft' OR is_platform_admin());

-- --- POST-CONDITIONS. These abort too, rolling the ALTER back with them. ---
do $post$
declare
  visible  int;
  sees_sm  boolean;
  sees_zz  boolean;
  avail    int;
  codes    text;
  sm_stat  text;
  sm_len   int;
  sm_dirty boolean;
  npol     int;
  catcmd   "char";
  expected_codes constant text :=
    'AIE-I, AIGRM-I, AIHR-I, AIMS-F, AIMS-IA, AISM-I, ISMS-F, ISMS-IA, SD-AI-I, SM-AI-I, SPO-AI-I';
begin
  execute 'set local role anon';
  select count(*), bool_or(code = 'SM-AI-II'), bool_or(code = 'ZZ-TEST-I'),
         count(*) filter (where status = 'available'),
         string_agg(code, ', ' order by code) filter (where status = 'available')
    into visible, sees_sm, sees_zz, avail, codes
    from public.certifications;
  select status,
         length(replace(exam_blueprint->'item_model'->>'grounding_note', chr(13), '')),
         exam_blueprint::text ~ '\.mjs|\.ts|HANDOFF|migration [0-9]|scripts/|verify-cert'
    into sm_stat, sm_len, sm_dirty
    from public.certifications where code = 'SM-AI-II';
  execute 'reset role';

  -- the write path, against the catalogue rather than by attempting a write
  select count(*) into npol from pg_policy where polrelid = 'public.certifications'::regclass;
  select polcmd into catcmd from pg_policy
   where polrelid = 'public.certifications'::regclass and polname = 'catalog read certifications';

  if visible <> 12 then
    raise exception using message = 'anon does not see 12 certifications',
      detail = format('sees %s', visible), hint = 'rolled back';
  end if;
  if not sees_sm then
    raise exception using message = 'SM-AI-II is still invisible to anon', hint = 'rolled back';
  end if;
  -- THE NEGATIVE HALF. A policy of `true` passes every other check on this page.
  if sees_zz then
    raise exception using message = 'ZZ-TEST-I became visible to anon',
      detail = 'draft must stay hidden', hint = 'rolled back';
  end if;
  if avail <> 11 or codes is distinct from expected_codes then
    raise exception using message = 'the eleven available certifications are not the same eleven',
      detail = coalesce(codes, '(null)'), hint = 'rolled back';
  end if;
  if sm_stat <> 'coming_soon' or sm_len <> 1846 or sm_dirty then
    raise exception using message = 'what anon now reads of SM-AI-II is not what 293 wrote',
      detail = format('status %s, note %s, names_internals %s', sm_stat, sm_len, sm_dirty),
      hint = 'rolled back';
  end if;
  if npol <> 3 or catcmd <> 'r' then
    raise exception using message = 'the policy set on certifications changed shape',
      detail = format('%s policies, catalogue polcmd %s', npol, catcmd),
      hint = 'this migration widens a READ and must not touch a write; rolled back';
  end if;

  insert into _v294 values
    (1,  'anon visible',                visible::text,  '12'),
    (2,  'anon sees SM-AI-II',          sees_sm::text,  'true'),
    (3,  'anon sees ZZ-TEST-I (draft)', sees_zz::text,  'false'),
    (4,  'available still visible',     avail::text,    '11'),
    (5,  'the same eleven codes',       codes,          expected_codes),
    (6,  'SM-AI-II status',             sm_stat,        'coming_soon'),
    (7,  'SM-AI-II note len, CRs off',  sm_len::text,   '1846'),
    (8,  'SM-AI-II names internals',    sm_dirty::text, 'false'),
    (9,  'policies on certifications',  npol::text,     '3'),
    (10, 'catalogue policy is SELECT',  catcmd::text,   'r');
end
$post$;

commit;


-- --- The one visible result set. 10 rows, all ok = true. -------------------
select ord, check_name, actual, expected, (actual = expected) as ok
from _v294 order by ord;
