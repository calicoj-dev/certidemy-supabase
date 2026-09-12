-- 297: SM-AI-II goes available
--
-- ONE PASTE. Pre- AND post-conditions ABORT inside the transaction that flips
-- the status, so a wrong outcome takes the flip with it.
--
-- ============================================================================
-- WHY A MIGRATION AND NOT THE CONSOLE
-- ============================================================================
--
-- The console can set this field. A release decision that leaves no file and no
-- guard is one nobody can audit afterwards - and this is the moment a
-- certification stops being a catalogue entry and starts being an examination a
-- candidate pays for.
--
-- ============================================================================
-- WHAT ALREADY GUARDS THIS AT THE DATABASE LEVEL
-- ============================================================================
--
-- trg_guard_cert_has_active_achievement (migration 249) is a BEFORE trigger on
-- certifications that fires ONLY on the transition into 'available' - it
-- returns early when new.status is not 'available', and again when
-- old.status was already 'available'. This update is exactly the case it was
-- written for. It refuses unless:
--
--   an achievement row exists for the certification
--   its status is 'active'
--   its achievement_type is 'Certification'
--   its issuer is_active
--
-- THE PRE-CONDITIONS BELOW MIRROR IT ON PURPOSE, and that is not redundancy: a
-- trigger failure aborts with a check_violation partway through a transaction,
-- while these abort first and say which condition failed in the migration's own
-- vocabulary. The trigger is the guarantee; this is the readable error.
--
-- Measured 2026-09-11: achievement active, type Certification, issuer
-- 'certidemy' active. The trigger will pass.
--
-- ============================================================================
-- WHAT CHANGES BECAUSE THE VALUE IS 'available' SPECIFICALLY
-- ============================================================================
--
-- Named before the flip rather than discovered after. Grepped across both
-- repos for status = 'available' rather than for status <> 'draft'.
--
-- THE ONE THAT MATTERS. functions/generate-mock-exam refuses to assemble a
-- CERTIFICATION EXAM unless status = 'available', and it checks BEFORE the
-- voucher is consumed so a freeze never burns an attempt. Today that check
-- refuses every SM-AI-II exam. After this migration it permits them. THIS
-- MIGRATION IS WHAT OPENS THE EXAM, not the catalogue change in 294.
--
-- functions/assign-voucher          refuses to assign a voucher for a cert that
--                                   is not available. Opens here.
-- functions/analyze-curriculum      skips non-available certs.
-- functions/lti-deep-link           offers only available certs to an LTI
--                                   platform. SM-AI-II becomes selectable.
-- functions/open-badge              THE CREDENTIAL DOCUMENT'S SHAPE. The public
--                                   achievement definition returns null unless
--                                   the cert is available, and the emitter
--                                   THROWS if a cert is available and has no
--                                   English claim. SM-AI-II has one (checked
--                                   below), and it holds no credentials yet, so
--                                   nothing already in the world changes.
-- certidemy-web lib/certifications  the learner cert switcher lists only
--                                   available certs - SM-AI-II appears in it.
--                                   is_published is DERIVED as
--                                   status === 'available' and flips with this.
-- certidemy-web sitemap / llms.txt / lib/standard / console coverage
--                                   public listings scoped to available.
--
-- WHAT DOES NOT CHANGE, checked rather than assumed:
--
--   credential.achievement (verify-cert s12) SKIPS only while status is
--   'draft'. SM-AI-II has been 'coming_soon' since before 294, so that check
--   has ALREADY been running and passing. This flip changes nothing for it.
--
--   The catalogue RLS policy reads status <> 'draft' (migration 294), so
--   readability does not change either - SM-AI-II is already anon-readable.
--   What changes is what the row SAYS, and what the exam path does about it.
--
-- ============================================================================
-- THE PASTE
-- ============================================================================
begin;

drop table if exists pg_temp._v297;
create temp table _v297 (ord int, check_name text, actual text, expected text);

do $pre$
declare
  v_status text; v_ach_status text; v_ach_type text; v_issuer_active boolean;
  v_tx_total int; v_tx_approved int; v_tx_prov int; v_tx_rejected int;
  v_dirty boolean; v_claim int; v_desc int; v_secure int; v_jta int;
begin
  select status into v_status from public.certifications where code = 'SM-AI-II';
  if v_status is null then
    raise exception using message = 'SM-AI-II not found';
  end if;
  if v_status = 'available' then
    raise exception using message = '297 has already run', detail = 'status is already available';
  end if;
  if v_status <> 'coming_soon' then
    raise exception using message = 'SM-AI-II is not where 297 expects it',
      detail = format('status is %s, expected coming_soon', v_status);
  end if;

  -- (1) the achievement, mirroring trg_guard_cert_has_active_achievement
  select a.status, a.achievement_type, i.is_active
    into v_ach_status, v_ach_type, v_issuer_active
  from public.achievements a
  left join public.issuers i on i.id = a.issuer_id
  join public.certifications c on c.id = a.certification_id
  where c.code = 'SM-AI-II';
  if v_ach_status is null then
    raise exception using message = 'SM-AI-II has no achievement row',
      detail = 'credentials.achievement_id is NOT NULL - every passing candidate would receive nothing',
      hint = 'CERT-PUBLISH-CHECKLIST 6.7 has the insert';
  end if;
  if v_ach_status <> 'active' or v_ach_type <> 'Certification' or not coalesce(v_issuer_active, false) then
    raise exception using message = 'the achievement is not fit to mint against',
      detail = format('status %s (active), type %s (Certification), issuer_active %s (true)',
                      v_ach_status, v_ach_type, v_issuer_active);
  end if;

  -- (2) 98 of 98 translations approved, none provisional, none rejected
  select count(*),
         count(*) filter (where review_status = 'approved'),
         count(*) filter (where is_provisional),
         count(*) filter (where review_status = 'rejected')
    into v_tx_total, v_tx_approved, v_tx_prov, v_tx_rejected
  from (
    select tt.review_status, tt.is_provisional
      from public.task_translations tt
      join public.tasks t on t.id = tt.task_id
      join public.certifications c on c.id = t.certification_id
     where c.code = 'SM-AI-II'
    union all
    select dt.review_status, dt.is_provisional
      from public.domain_translations dt
      join public.domains d on d.id = dt.domain_id
      join public.certifications c on c.id = d.certification_id
     where c.code = 'SM-AI-II'
  ) z;
  if v_tx_total <> 98 or v_tx_approved <> 98 or v_tx_prov <> 0 or v_tx_rejected <> 0 then
    raise exception using message = 'the blueprint translations are not all approved',
      detail = format('%s rows, %s approved (98), %s provisional (0), %s rejected (0)',
                      v_tx_total, v_tx_approved, v_tx_prov, v_tx_rejected),
      hint = 'a candidate reads these before paying';
  end if;

  -- (3) the blueprint names no repository internals (verify-cert invariant 23)
  select exam_blueprint::text ~ '\.mjs|\.ts|HANDOFF|migration [0-9]|scripts/|verify-cert'
    into v_dirty from public.certifications where code = 'SM-AI-II';
  if coalesce(v_dirty, true) then
    raise exception using message = 'the blueprint still names repository internals',
      hint = 'migration 293 cleaned it - has something rewritten it since?';
  end if;

  -- (4) the surfaces 'available' switches on. open-badge THROWS on an available
  --     cert with no English claim, so this one is not paperwork.
  -- QUALIFIED. certifications carries its own `description`, so the unqualified
  -- form raises 42702 - caught by pre-flighting this block read-only before the
  -- migration was handed over, which is the only reason it is not an abort at
  -- paste time on a release flip.
  select count(*) filter (where ci.lang in ('en','es-419','pt-BR') and coalesce(ci.claim,'') <> ''),
         count(*) filter (where ci.lang in ('en','es-419','pt-BR') and coalesce(ci.description,'') <> '')
    into v_claim, v_desc
  from public.certification_i18n ci
  join public.certifications c on c.id = ci.certification_id
  where c.code = 'SM-AI-II';
  if v_claim <> 3 or v_desc <> 3 then
    raise exception using message = 'catalogue copy is incomplete',
      detail = format('%s claim(s) of 3, %s description(s) of 3', v_claim, v_desc),
      hint = 'open-badge throws if an available cert has no English claim';
  end if;

  -- (5) an exam can actually be assembled: a published JTA and a secure,
  --     in-scope, approved bank. generate-mock-exam starts refusing "not
  --     available" and starts refusing "pool insufficient" instead.
  select count(*) into v_jta from public.jta_versions j
   join public.certifications c on c.id = j.certification_id
   where c.code = 'SM-AI-II' and lower(j.status) = 'published';
  if v_jta < 1 then
    raise exception using message = 'SM-AI-II has no published JTA version';
  end if;
  select count(*) into v_secure from public.quiz_questions q
   join public.certifications c on c.id = q.certification_id
   where c.code = 'SM-AI-II' and q.pool = 'secure' and q.status = 'approved'
     and q.retired_at is null and q.is_exam_scope;
  if v_secure <> 1056 then
    raise exception using message = 'the secure in-scope bank is not the bank 297 was written against',
      detail = format('%s items, expected 1056', v_secure);
  end if;
end
$pre$;


-- ----------------------------------------------------------------------------
-- THE FLIP. One column, one row.
-- ----------------------------------------------------------------------------
-- Scoped by code AND by current status: if anything moved this row between the
-- pre-condition and here, zero rows update and the post-condition catches it.
update public.certifications
   set status = 'available'
 where code = 'SM-AI-II' and status = 'coming_soon';


do $post$
declare
  v_status text; v_visible int; v_avail int; v_sees_zz boolean; v_codes text;
  expected_codes constant text :=
    'AIE-I, AIGRM-I, AIHR-I, AIMS-F, AIMS-IA, AISM-I, ISMS-F, ISMS-IA, SD-AI-I, SM-AI-I, SM-AI-II, SPO-AI-I';
begin
  -- BEHAVIOUR, as anon, inside the transaction that made the change.
  execute 'set local role anon';
  select count(*), count(*) filter (where status = 'available'),
         bool_or(code = 'ZZ-TEST-I'),
         string_agg(code, ', ' order by code) filter (where status = 'available')
    into v_visible, v_avail, v_sees_zz, v_codes
    from public.certifications;
  select status into v_status from public.certifications where code = 'SM-AI-II';
  execute 'reset role';

  if v_status is distinct from 'available' then
    raise exception using message = 'anon does not read SM-AI-II as available',
      detail = format('reads %s', coalesce(v_status, '(invisible)')), hint = 'rolled back';
  end if;
  if v_avail <> 12 then
    raise exception using message = 'the available set is not 12',
      detail = format('%s', v_avail), hint = 'rolled back';
  end if;
  -- THE NEGATIVE HALF, twice over: the draft stays hidden, and the eleven that
  -- were already available are the SAME eleven. A count of 12 passes on a flip
  -- that also dropped a live certification.
  if v_sees_zz then
    raise exception using message = 'ZZ-TEST-I became visible', hint = 'rolled back';
  end if;
  if v_codes is distinct from expected_codes then
    raise exception using message = 'the available certifications are not the expected twelve',
      detail = coalesce(v_codes, '(null)'), hint = 'rolled back';
  end if;
  if v_visible <> 12 then
    raise exception using message = 'anon visibility changed',
      detail = format('%s visible, expected 12 - the catalogue policy reads status <> draft, so this flip must not move it', v_visible),
      hint = 'rolled back';
  end if;

  insert into _v297 values
    (1, 'anon reads SM-AI-II as',      v_status,        'available'),
    (2, 'available certifications',    v_avail::text,   '12'),
    (3, 'anon visible (unchanged)',    v_visible::text, '12'),
    (4, 'anon sees ZZ-TEST-I (draft)', v_sees_zz::text, 'false'),
    (5, 'the twelve, by code',         v_codes,         expected_codes);
end
$post$;

commit;


-- ----------------------------------------------------------------------------
-- The one visible result set. 5 rows, all ok = true.
-- ----------------------------------------------------------------------------
select ord, check_name, actual, expected, (actual = expected) as ok
from _v297 order by ord;
-- If this says _v297 does not exist, the transaction aborted and SM-AI-II is
-- still coming_soon. The raised message is above it.
--
-- AFTERWARDS, and it is not optional: re-run
--   node scripts/verify-cert.mjs --cert SM-AI-II
-- The release gate is a node script and cannot be asserted from SQL. It read
-- 53 pass / 0 fail / 3 warn immediately before this migration was written.
