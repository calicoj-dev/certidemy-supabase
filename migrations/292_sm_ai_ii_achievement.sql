-- 292: SM-AI-II gets an achievement, without which a passing candidate receives nothing
--
-- ONE STATEMENT, THREE GUARDS.
--
-- ============================================================================
-- THE DEFECT, WHICH IS NOT A VERIFY-CERT NICETY
-- ============================================================================
--
-- CERT-PUBLISH-CHECKLIST section 6.7: NOTHING CREATES AN ACHIEVEMENT. No trigger
-- on certifications, no function, no edge function. Migration 231 inserted one
-- per certification as a ONE-TIME BACKFILL over the eleven that existed on
-- 2026-08-19 and left no forward mechanism.
--
-- credentials.achievement_id is NOT NULL. So a certification created after that
-- date cannot mint a credential at all. The cert passes every other check, sells
-- seats, runs exams, scores them, writes the exam_attempts row - AND THEN FAILS
-- AT THE MINT, in front of a candidate who has just passed.
--
-- SM-AI-II is now coming_soon, so this is the gate between coming_soon and
-- available rather than a later tidy-up. verify-cert skips the check while a
-- cert is draft and fails it from coming_soon onward, which is why it surfaced
-- tonight and not in August.
--
-- ============================================================================
-- THE FOUR THINGS SECTION 6.7 WARNS WILL BITE, ALL FOUR HANDLED
-- ============================================================================
--
--   achievement_type MUST be 'Certification'. The column DEFAULTS to
--   'Certificate' and guard_achievement_identity rejects anything else once
--   certification_id is set. Spelled out below rather than defaulted.
--
--   status MUST be 'active'. The mint refuses draft or archived - a credential
--   pointing at an inactive definition claims something nothing defines.
--
--   THE CODE IS IMMUTABLE once a credential exists, and it becomes the public
--   URL /achievements/SM-AI-II inside signed documents that must resolve for as
--   long as any credential exists. Chosen once, matching both siblings:
--   SM-AI-I and ISMS-IA are Certification/active on their own codes.
--
--   achievements_certification_unique is a PARTIAL UNIQUE INDEX - one
--   achievement per certification, ever - so re-running this insert is safe and
--   a second, different one is impossible.
--
-- VERIFIED BEFORE WRITING, not assumed:
--   issuer 'certidemy' exists and is_active   -> 1
--   achievements.code = 'SM-AI-II' taken      -> 0
--   achievement for this certification        -> 0
--   certifications.description non-empty      -> true, so the coalesce is inert
--
-- NO SCHEMA CHANGE. One row inserted. Nothing else touched.
--
-- Run in the Supabase SQL editor. One statement, then three guards.
-- ============================================================================


-- 1. the achievement
insert into public.achievements
  (issuer_id, code, achievement_type, certification_id, name, description,
   authoring_depth, status)
select
  (select id from public.issuers where slug = 'certidemy' and is_active),
  c.code, 'Certification', c.id, c.name,
  coalesce(nullif(c.description, ''), c.name),
  'certification', 'active'
from public.certifications c
where c.code = 'SM-AI-II'
on conflict do nothing;


-- ============================================================================
-- GUARD 1 - the row exists and is the SHAPE the mint requires. Named
-- properties, not a count: a row that exists with the default
-- achievement_type would satisfy a count and fail at the mint.
-- ============================================================================
do $$
declare a record;
begin
  select ach.code, ach.achievement_type, ach.status, ach.authoring_depth,
         i.slug as issuer_slug, ach.certification_id
    into a
  from public.achievements ach
  join public.certifications c on c.id = ach.certification_id
  left join public.issuers i on i.id = ach.issuer_id
  where c.code = 'SM-AI-II';

  if a is null then
    raise exception 'no achievement for SM-AI-II'
      using hint = 'the insert matched no certification row';
  end if;
  if a.code is distinct from 'SM-AI-II' then
    raise exception 'achievement code is not SM-AI-II'
      using detail = a.code, hint = 'the code is immutable once a credential exists';
  end if;
  if a.achievement_type is distinct from 'Certification' then
    raise exception 'achievement_type is not Certification'
      using detail = a.achievement_type,
            hint = 'the column defaults to Certificate; the mint guard rejects it';
  end if;
  if a.status is distinct from 'active' then
    raise exception 'achievement is not active'
      using detail = a.status, hint = 'the mint refuses draft or archived';
  end if;
  if a.issuer_slug is distinct from 'certidemy' then
    raise exception 'achievement is not issued by certidemy'
      using detail = coalesce(a.issuer_slug, '(null issuer)');
  end if;
end $$;


-- ============================================================================
-- GUARD 2 - EXACTLY ONE, AND NOTHING ELSE MOVED. The negative half.
--
-- An insert that matched more than one certification, or that ran twice before
-- the partial index existed, is invisible in a "does it exist" check. And a
-- migration that accidentally touched another cert's achievement would pass
-- guard 1 completely.
-- ============================================================================
do $$
declare n int;
declare bad text;
begin
  select count(*) into n
  from public.achievements ach
  join public.certifications c on c.id = ach.certification_id
  where c.code = 'SM-AI-II';
  if n <> 1 then
    raise exception 'SM-AI-II has % achievements, expected exactly 1', n
      using hint = 'achievements_certification_unique should have prevented this';
  end if;

  -- every non-draft certification must still have exactly one active
  -- Certification achievement. Names the certs that do not.
  select string_agg(c.code, ', ' order by c.code) into bad
  from public.certifications c
  where c.status <> 'draft'
    and 1 <> (select count(*) from public.achievements ach
              where ach.certification_id = c.id
                and ach.achievement_type = 'Certification'
                and ach.status = 'active');
  if bad is not null then
    raise exception 'certifications without exactly one active Certification achievement'
      using detail = bad,
            hint = 'this migration must add one and disturb none';
  end if;
end $$;


-- ============================================================================
-- GUARD 3 - the credential path is now open, checked at the column that
-- closed it. credentials.achievement_id is NOT NULL, and the reason this
-- migration exists is that nothing could satisfy it.
-- ============================================================================
do $$
declare ok boolean;
begin
  select exists (
    select 1 from public.achievements ach
    join public.certifications c on c.id = ach.certification_id
    where c.code = 'SM-AI-II' and ach.status = 'active'
      and ach.achievement_type = 'Certification'
  ) into ok;
  if not ok then
    raise exception 'a passing candidate would still receive nothing'
      using hint = 'score-mock-exam resolves the achievement by certification_id';
  end if;
end $$;


-- Read, not asserted.
select c.code, ach.code as achievement_code, ach.achievement_type, ach.status,
       i.slug as issuer, left(ach.description, 70) as description_start
from public.achievements ach
join public.certifications c on c.id = ach.certification_id
left join public.issuers i on i.id = ach.issuer_id
where c.code = 'SM-AI-II';
