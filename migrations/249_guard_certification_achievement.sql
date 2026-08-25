-- 249_guard_certification_achievement.sql
--
-- A live certification always has an active achievement. Enforced from BOTH
-- sides, by refusal. Neither guard creates a row.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-25. The file is the
-- record of what already ran, not a script anyone executes. Both bodies below
-- were read back from live prosrc and verified by md5 with CRs stripped:
--
--   guard_cert_has_active_achievement   5b083360884f6e2a8eb1ac9d6970dc87
--   guard_achievement_backs_live_cert   fe75a6b8d3becfbc6c78bd4bffb68a5a
--
-- They are the live bodies, modulo line endings.
--
-- ============================ WHAT THIS CLOSES ==============================
--
-- credentials.achievement_id is NOT NULL (migration 231). Migration 231 created
-- one achievement per certification as a ONE-TIME backfill over the eleven that
-- existed on 2026-08-19, and left NO forward mechanism. Nothing -- no trigger,
-- no function, no edge function -- creates the achievement row for a new
-- certification. Every public function body was scanned; none inserts into
-- achievements.
--
-- So a certification created after 2026-08-19 passes verify-cert, sells seats,
-- runs exams and scores them, and then cannot mint. The candidate sees a pass,
-- exam_attempts records it, and no credential exists. That is the same defect
-- that took out score-mock-exam for six days (see the 2026-08-25 commit): a
-- fact that lived in one migration's history and in nobody's checklist.
--
-- ============================ WHY REFUSE, NOT CREATE ========================
--
-- The obvious fix -- a trigger creating the achievement on certification INSERT
-- -- cannot work, for two independent reasons.
--
--   1. The mint requires status = 'active'. A trigger creating a 'draft'
--      achievement does not close the gap; it moves the forgotten step from
--      "insert the row" to "activate the row", behind a row that LOOKS done.
--
--   2. achievements_read is (status = 'active' OR can_read_issuer(issuer_id)).
--      Creating it 'active' therefore publishes an OB3 achievement definition
--      -- a claim about what a credential attests -- for a certification nobody
--      has finished drafting, with a description the trigger invented, because
--      achievements.description is NOT NULL and certifications.description is
--      not. That is the platform asserting something the issuer did not.
--
-- Every guard trigger in this schema refuses; not one fabricates data
-- (guard_cert_identity, guard_credential_issuer, guard_achievement_identity,
-- prevent_delete_presented_item, check_domain_weights_sum). These two follow
-- that idiom.
--
-- The real invariant is not "every certification has an achievement" -- a draft
-- genuinely does not need one, and forcing it there is what would create
-- abandoned definitions. It is "every certification that can be EXAMINED has an
-- active achievement", and that becomes true at exactly one moment.
--
-- ============================ WHY BOTH DIRECTIONS ===========================
--
-- Section 1 guards the transition INTO 'available'. Section 2 exists because
-- the same exposure arrives from the other side: an achievement archived or
-- deleted while its certification is already live.
--
-- Through the application that is unreachable. update-partner-achievement is
-- the only code that writes achievements.status, and it raises 409 on any
-- certification-backed row BEFORE requireIssuerAccess is even called;
-- create-partner-achievement never sets certification_id;
-- upload-achievement-image branches on it and refuses. The table has one policy
-- (achievements_read) and one grant (authenticated:SELECT), so no browser
-- client can write it at all.
--
-- Through the SQL editor it is wide open, and on this platform that is not
-- hypothetical -- it is how everything gets done.
--
-- DELETE is the sharper case. credentials.achievement_id is ON DELETE RESTRICT,
-- which protects an achievement only ONCE A CREDENTIAL EXISTS. A certification
-- that is live, has sold seats, and has not yet minted its first credential has
-- zero referencing rows, so a plain delete succeeds. That is the launch window,
-- and it is precisely the window the achievement_id bug lived in.
--
-- ============================ WHY INSERT IS REFUSED =========================
--
-- Section 1's trigger covers INSERT as well as UPDATE OF status. A cert can be
-- created directly at 'available', which a BEFORE UPDATE trigger would miss
-- entirely. Since the achievement carries the certification id, which does not
-- exist until the insert completes, NO ordering makes an insert at 'available'
-- satisfiable. Refusing it forces the documented order: create at draft, insert
-- the achievement, flip.
--
-- ============================ NOT VERIFIED BY DOING IT ======================
--
-- There is no archive-and-see test in this file. For a refusal guard the check
-- and the damage are the same action. Migration 246 shipped exactly that as a
-- commented "expect 42501" step, it succeeded instead of failing, and signup
-- was silently dead. Verification is against pg_catalog only -- section 3.
--
-- Precondition, checked before either trigger was created: all eleven live
-- certifications already satisfy the rule (0 violating rows), so neither guard
-- blocks anything that exists today.
--
-- Surfacing: set-cert-status is the function that will raise these. It is
-- idempotent, so a no-op flip short-circuits before the guard is reached.

-- ---------------------------------------------------------------------------
-- 1. Entry guard: a certification cannot become 'available' without an active,
--    Certification-typed achievement on an active issuer.
--
--    NOTE ON SHAPE: the INSERT refusal is nested inside an ELSE on
--    tg_op = 'UPDATE'. It is NOT written as
--    `tg_op = 'UPDATE' and old.status = 'available'` in one condition --
--    referencing OLD in an INSERT trigger raises "record old is not assigned
--    yet", and relying on short-circuit evaluation to avoid that works until it
--    does not.
--
--    Live body md5, CRs stripped: 5b083360884f6e2a8eb1ac9d6970dc87
-- ---------------------------------------------------------------------------

create or replace function public.guard_cert_has_active_achievement()
returns trigger
language plpgsql
as $function$
declare
  v_status text;
  v_type   text;
  v_issuer boolean;
  v_found  boolean;
begin
  if new.status is distinct from 'available' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'available' then
      return new;
    end if;
  else
    raise exception using
      errcode = 'check_violation',
      message = format('Certification %s cannot be created at status available.', new.code),
      hint = 'Create at draft, insert the achievement (CHECKLIST 6.7), then flip status.';
  end if;

  select true, a.status, a.achievement_type, i.is_active
    into v_found, v_status, v_type, v_issuer
  from public.achievements a
  left join public.issuers i on i.id = a.issuer_id
  where a.certification_id = new.id;

  if not coalesce(v_found, false) then
    raise exception using
      errcode = 'check_violation',
      message = format('Certification %s has no achievement row.', new.code),
      detail = 'credentials.achievement_id is NOT NULL, so every passing candidate would receive nothing.',
      hint = 'CERT-PUBLISH-CHECKLIST 6.7 has the insert.';
  end if;

  if v_status is distinct from 'active' then
    raise exception using
      errcode = 'check_violation',
      message = format('Certification %s has an achievement that is %s, not active.', new.code, v_status),
      detail = 'The mint refuses a non-active achievement.',
      hint = 'Set the achievement to active first.';
  end if;

  if v_type is distinct from 'Certification' then
    raise exception using
      errcode = 'check_violation',
      message = format('Certification %s has an achievement of type %s.', new.code, v_type),
      detail = 'A certification-backed achievement must be type Certification.',
      hint = 'Correct achievement_type first.';
  end if;

  if not coalesce(v_issuer, false) then
    raise exception using
      errcode = 'check_violation',
      message = format('Certification %s has an achievement on an inactive issuer.', new.code),
      detail = 'credentials.issuer_id comes from the achievement and must match.',
      hint = 'Activate the issuer first.';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_guard_cert_has_active_achievement on public.certifications;
create trigger trg_guard_cert_has_active_achievement
  before insert or update of status on public.certifications
  for each row execute function public.guard_cert_has_active_achievement();

-- ---------------------------------------------------------------------------
-- 2. Dependency guard: an achievement backing a live certification cannot be
--    archived, detached or deleted.
--
--    'unavailable' counts as live alongside 'available'. A freeze blocks new
--    starts, but score-mock-exam still scores and mints an attempt already in
--    flight (mintable = available OR unavailable), so the achievement is still
--    load-bearing there.
--
--    NOTE ON SHAPE: the DELETE case returns early rather than
--    `if tg_op = 'DELETE' then return old; else return new; end if;` inline,
--    because NEW is not assigned on a DELETE.
--
--    Live body md5, CRs stripped: fe75a6b8d3becfbc6c78bd4bffb68a5a
-- ---------------------------------------------------------------------------

create or replace function public.guard_achievement_backs_live_cert()
returns trigger
language plpgsql
as $function$
declare
  v_code   text;
  v_status text;
begin
  if old.certification_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  select c.code, c.status into v_code, v_status
  from public.certifications c
  where c.id = old.certification_id;

  if v_status is null or v_status not in ('available', 'unavailable') then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    raise exception using
      errcode = 'restrict_violation',
      message = format('Achievement %s cannot be deleted.', old.code),
      detail = format('Certification %s is %s and depends on it.', v_code, v_status),
      hint = 'Move the certification to draft first if you mean to withdraw it.';
  end if;

  if new.status is distinct from 'active' then
    raise exception using
      errcode = 'restrict_violation',
      message = format('Achievement %s cannot be set to %s.', old.code, new.status),
      detail = format('Certification %s is %s and depends on it.', v_code, v_status),
      hint = 'Move the certification to draft first if you mean to withdraw it.';
  end if;

  if new.certification_id is distinct from old.certification_id then
    raise exception using
      errcode = 'restrict_violation',
      message = format('Achievement %s cannot be detached.', old.code),
      detail = format('Certification %s is %s and the mint resolves by certification_id.', v_code, v_status),
      hint = 'Change the certification status first.';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_guard_achievement_backs_live_cert on public.achievements;
create trigger trg_guard_achievement_backs_live_cert
  before update or delete on public.achievements
  for each row execute function public.guard_achievement_backs_live_cert();

-- ---------------------------------------------------------------------------
-- 3. Verification. pg_catalog only. Run separately.
--
--    Expect exactly TWO rows, both tgenabled = 'O', one on certifications and
--    one on achievements:
--
--      trg_guard_achievement_backs_live_cert | achievements   | O
--      trg_guard_cert_has_active_achievement | certifications | O
--
--    Confirmed live on 2026-08-25.
--
--    Do NOT verify these by archiving an achievement or by inserting a cert at
--    'available'. See the header.
-- ---------------------------------------------------------------------------

-- select t.tgname, c.relname as on_table, t.tgenabled, pg_get_triggerdef(t.oid) as def
-- from pg_trigger t
-- join pg_class c on c.oid = t.tgrelid
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and t.tgname in ('trg_guard_cert_has_active_achievement',
--                    'trg_guard_achievement_backs_live_cert')
-- order by t.tgname;

--    The property the guards enforce, as a standing check. Zero rows is the
--    pass; any row names a certification that will fail at the mint.
--
-- select c.code
-- from public.certifications c
-- left join public.achievements a on a.certification_id = c.id
-- left join public.issuers i on i.id = a.issuer_id
-- where c.status in ('available', 'unavailable')
-- group by c.code
-- having count(a.id) <> 1
--     or not bool_and(a.status = 'active')
--     or not bool_and(a.achievement_type = 'Certification')
--     or not bool_and(i.is_active);
