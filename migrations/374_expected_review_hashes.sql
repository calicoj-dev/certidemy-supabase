-- 374_expected_review_hashes.sql
--
-- EACH GATE STATES WHAT IT WILL COMPARE AGAINST, SO A WRITER CAN ASK INSTEAD OF
-- REIMPLEMENTING IT.
--
-- ============ WHY ============
--
-- Twice on 2026-09-25 a writer recomputed a gate's hash with a formula it had
-- inferred, and both times the gate disagreed:
--
--   * a lesson clearance recomputed en_hash with translation_hash where the
--     review arm uses left(md5(content_md), 8);
--   * the own-work apply invented translation_hash over four newline-joined
--     fields where task_ksa_is_withheld uses
--     translation_hash(knowledge, skills, abilities) -- three arguments, no
--     statement, no join. Two review rows were written that could never match and
--     ISMS-F task 5.2 went dark in both languages for 44 seconds (INCIDENTS.md).
--
-- CLAUDE.md already carried the rule -- recompute with the function that WROTE
-- the value. Both slips happened anyway, by sessions that had read it. A rule
-- broken twice in one day is a rule without a mechanism.
--
-- So the expressions move OUT of the writers and INTO one read-only function per
-- arm, built from the SAME expressions the gate evaluates. A writer asks; it does
-- not know the formula and cannot get it wrong.
--
-- ============ THE REVIEW-SELECTION RULE: **ANY**, NOT LATEST ============
--
-- Named here because the first version of this migration's fixture got it wrong
-- and REFUSED ITSELF against a perfectly correct database. Read out of pg_proc,
-- not remembered:
--
--   lesson   mcp.lesson_withholding_reason:  NOT EXISTS (... r.en_hash = ... AND
--            r.tr_hash = ...) -- so ANY approved review matching BOTH hashes
--            clears the row. Not the latest. Not the only one. Any.
--   task     public.task_ksa_is_withheld:    the same NOT EXISTS shape, same rule.
--   concept  mcp.concept joins concept_translations and compares the ROW'S OWN
--            en_hash / tr_hash columns. There is no review table in that
--            predicate, so the relation is 1:1 and nothing is selected.
--
-- A SUBJECT ROUTINELY CARRIES SEVERAL APPROVED REVIEWS, one per time it was
-- cleared, and the older ones are stale BY DESIGN -- that is what supersession
-- looks like in a table with no supersession column. Attempt 1 asserted that
-- EVERY approved review on a serving lesson matched the helper, and raised on
-- three rows that each hold one stale review and one current one:
--
--   05-02-aims-internal-audit es-419   06:38 stale, 14:07 current
--   05-02-aims-internal-audit pt-BR    06:38 stale, 14:07 current
--   isms-ia-04-02 pt-BR                09-18 stale, 09-25 current
--
-- In all three the helper reproduced the CURRENT review's hashes exactly. The
-- helper was right and the fixture was wrong -- the literal-assertion failure
-- this repository records four times over, this time inside the very fixture
-- written to prevent an inferred formula. Those three rows are now a NAMED
-- POSITIVE CONTROL below: they must be in the checked set and they must pass.
--
-- ============ WHAT THIS DOES NOT CHANGE ============
--
-- Nothing about MCP behaviour. The gates are untouched: no view is redefined, no
-- gate function is replaced. These are additive read-only helpers for writers.
--
-- ============ THREE ARMS, NOT FOUR ============
--
-- lesson, task, concept. There is no item function because THERE IS NO ITEM
-- GATE: `item_translation_reviews` holds 30 rows and is referenced by no
-- function, no view, and no edge function -- checked against pg_proc, every view
-- definition, and both repositories. Writing a fourth helper would assert a gate
-- that does not exist, and this file's whole subject is not asserting things
-- about gates that are not true. The finding is recorded rather than papered over.
--
-- ============ SECURITY ============
--
-- SECURITY INVOKER, and revoked from PUBLIC / anon / authenticated. The concept
-- helper calls mcp.* because that is exactly what mcp.concept evaluates, so a
-- caller needs USAGE on mcp -- which service_role has and anon does not. That is
-- the same reachability property 364 was written about, and it is deliberate
-- here: a writer helper has no business being callable by a partner role.
--
-- ============ TRANSPORT ============
--
-- One begin/commit block. Attempt 1 raised inside the post-condition and the SQL
-- editor ROLLED THE WHOLE THING BACK -- verified afterwards: none of the three
-- functions existed and nothing else had landed. That is a datapoint on the open
-- question in CLAUDE.md about whether the editor honours a transaction: on
-- 2026-09-25 it did.

begin;

create or replace function public.expected_review_hashes_lesson(p_lesson_id uuid)
returns table (en_hash text, tr_hash text)
language sql
stable
security invoker
set search_path = ''
as $fn$
  -- EXACTLY the expressions mcp.lesson_withholding_reason compares against:
  --   r.en_hash = left(md5(en.content_md), 8)
  --   r.tr_hash = public.translation_hash(l.content_md)
  select left(md5(en.content_md), 8),
         public.translation_hash(l.content_md)
    from public.lessons l
    join public.lessons en
      on en.lesson_group_id = l.lesson_group_id
     and en.language = 'en'
   where l.id = p_lesson_id;
$fn$;

create or replace function public.expected_review_hashes_task(p_tt_id uuid)
returns table (en_hash text, tr_hash text)
language sql
stable
security invoker
set search_path = ''
as $fn$
  -- EXACTLY the expressions public.task_ksa_is_withheld compares against:
  --   r.en_hash = public.task_ksa_en_hash(tt.task_id)
  --   r.tr_hash = public.translation_hash(tt.knowledge, tt.skills, tt.abilities)
  select public.task_ksa_en_hash(tt.task_id),
         public.translation_hash(tt.knowledge, tt.skills, tt.abilities)
    from public.task_translations tt
   where tt.id = p_tt_id;
$fn$;

create or replace function public.expected_review_hashes_concept(p_ct_id uuid)
returns table (en_hash text, tr_hash text)
language sql
stable
security invoker
set search_path = ''
as $fn$
  -- EXACTLY the expressions the mcp.concept join evaluates:
  --   ct.en_hash = mcp.concept_row_en_hash(co.id)
  --   ct.tr_hash = mcp.translation_hash(ct.name, ct.description)
  -- The mcp.* wrappers, not the public originals, because the wrappers are what
  -- the view calls. They delegate and currently agree; using public here would
  -- be a SECOND implementation of the same idea, which is the defect this file
  -- exists to remove.
  select mcp.concept_row_en_hash(ct.concept_id),
         mcp.translation_hash(ct.name, ct.description)
    from public.concept_translations ct
   where ct.id = p_ct_id;
$fn$;

revoke all on function public.expected_review_hashes_lesson(uuid) from public;
revoke all on function public.expected_review_hashes_task(uuid) from public;
revoke all on function public.expected_review_hashes_concept(uuid) from public;
grant execute on function public.expected_review_hashes_lesson(uuid) to service_role;
grant execute on function public.expected_review_hashes_task(uuid) to service_role;
grant execute on function public.expected_review_hashes_concept(uuid) to service_role;

do $post$
declare
  v_total int;
  v_agree int;
  v_bad text;
  v_anon int;
  v_control int;
begin
  -- ============ THE FIXTURE ============
  --
  -- For every subject the gate CURRENTLY SERVES, AT LEAST ONE approved review
  -- must carry exactly what the helper returns. That is the gate's own rule --
  -- NOT EXISTS over any matching review -- and asserting anything stricter
  -- raises against a correct database, which is how attempt 1 failed.
  --
  -- Only rows the gate ACCEPTS are examined. A stale review is stale on purpose;
  -- a withheld row has nothing to agree with.

  -- LESSON arm
  select count(*),
         count(*) filter (where exists (
           select 1 from public.lesson_translation_reviews r
            where r.lesson_id = l.id and r.verdict = 'approved'
              and r.en_hash = e.en_hash and r.tr_hash = e.tr_hash)),
         string_agg(l.slug || '/' || l.language, ', ') filter (where not exists (
           select 1 from public.lesson_translation_reviews r
            where r.lesson_id = l.id and r.verdict = 'approved'
              and r.en_hash = e.en_hash and r.tr_hash = e.tr_hash))
    into v_total, v_agree, v_bad
    from public.lessons l
    cross join lateral public.expected_review_hashes_lesson(l.id) e
   where l.language <> 'en'
     and public.lesson_body_is_servable(l.id)
     and exists (select 1 from public.lesson_translation_reviews r
                  where r.lesson_id = l.id and r.verdict = 'approved');
  if v_total = 0 then
    raise exception 'lesson arm examined NOTHING -- a fixture with no subjects is vacuous, not passing';
  end if;
  if v_agree <> v_total then
    raise exception 'lesson arm: % of % serving lesson(s) have NO approved review matching the helper: %',
      v_total - v_agree, v_total, coalesce(v_bad, '?');
  end if;
  raise notice 'lesson arm: %/% serving lessons have a matching approved review', v_agree, v_total;

  -- NAMED POSITIVE CONTROL. The three rows attempt 1 raised on each hold one
  -- STALE review and one CURRENT one. They must be in the checked set and must
  -- pass; a future narrowing that quietly drops them fails here instead.
  select count(*) into v_control
    from public.lessons l
    cross join lateral public.expected_review_hashes_lesson(l.id) e
   where (l.slug, l.language) in (
           ('05-02-aims-internal-audit', 'es-419'),
           ('05-02-aims-internal-audit', 'pt-BR'),
           ('isms-ia-04-02-demonstrated-not-stated', 'pt-BR'))
     and public.lesson_body_is_servable(l.id)
     and (select count(*) from public.lesson_translation_reviews r
           where r.lesson_id = l.id and r.verdict = 'approved') > 1
     and exists (select 1 from public.lesson_translation_reviews r
                  where r.lesson_id = l.id and r.verdict = 'approved'
                    and r.en_hash = e.en_hash and r.tr_hash = e.tr_hash);
  if v_control <> 3 then
    raise exception 'multi-review control: % of 3 rows qualify and pass; attempt 1 raised on exactly these', v_control;
  end if;
  raise notice 'multi-review control: 3/3 -- a stale review beside a current one does not fail the gate';

  -- TASK arm, same rule
  select count(*),
         count(*) filter (where exists (
           select 1 from public.task_translation_reviews r
            where r.task_translation_id = tt.id and r.verdict = 'approved'
              and r.en_hash = e.en_hash and r.tr_hash = e.tr_hash)),
         string_agg(tt.language || '/' || tt.id::text, ', ') filter (where not exists (
           select 1 from public.task_translation_reviews r
            where r.task_translation_id = tt.id and r.verdict = 'approved'
              and r.en_hash = e.en_hash and r.tr_hash = e.tr_hash))
    into v_total, v_agree, v_bad
    from public.task_translations tt
    cross join lateral public.expected_review_hashes_task(tt.id) e
   where not public.task_ksa_is_withheld(tt.id)
     and exists (select 1 from public.task_translation_reviews r
                  where r.task_translation_id = tt.id and r.verdict = 'approved');
  if v_total = 0 then
    raise exception 'task arm examined NOTHING -- vacuous, not passing';
  end if;
  if v_agree <> v_total then
    raise exception 'task arm: % of % serving translation(s) have NO approved review matching the helper: %',
      v_total - v_agree, v_total, coalesce(v_bad, '?');
  end if;
  raise notice 'task arm: %/% serving task translations have a matching approved review', v_agree, v_total;

  -- CONCEPT arm. 1:1 -- the gate compares the ROW'S OWN columns, so the helper
  -- must equal them exactly and there is no review to select.
  select count(*),
         count(*) filter (where ct.en_hash = e.en_hash and ct.tr_hash = e.tr_hash),
         string_agg(co.slug || '/' || ct.language, ', ')
           filter (where ct.en_hash <> e.en_hash or ct.tr_hash <> e.tr_hash)
    into v_total, v_agree, v_bad
    from public.concept_translations ct
    join public.concepts co on co.id = ct.concept_id
    cross join lateral public.expected_review_hashes_concept(ct.id) e
   where ct.is_provisional = false
     and co.retired_at is null
     and ct.en_hash = mcp.concept_row_en_hash(co.id)
     and ct.tr_hash = mcp.translation_hash(ct.name, ct.description);
  if v_total = 0 then
    raise exception 'concept arm examined NOTHING -- vacuous, not passing';
  end if;
  if v_agree <> v_total then
    raise exception 'concept arm: % of % serving row(s) disagree with the helper: %',
      v_total - v_agree, v_total, coalesce(v_bad, '?');
  end if;
  raise notice 'concept arm: %/% serving rows agree', v_agree, v_total;

  -- NEGATIVE HALF: a helper nothing can call is not a helper, and one anon can
  -- call is an exposure. Both directions, because a one-sided grant check passes
  -- on a revoke that silently failed.
  select count(*) into v_anon
    from (values ('anon'), ('authenticated')) g(r)
   where has_function_privilege(g.r, 'public.expected_review_hashes_lesson(uuid)', 'EXECUTE')
      or has_function_privilege(g.r, 'public.expected_review_hashes_task(uuid)', 'EXECUTE')
      or has_function_privilege(g.r, 'public.expected_review_hashes_concept(uuid)', 'EXECUTE');
  if v_anon > 0 then
    raise exception 'anon or authenticated can EXECUTE an expected_review_hashes function';
  end if;
  if not has_function_privilege('service_role', 'public.expected_review_hashes_task(uuid)', 'EXECUTE') then
    raise exception 'service_role cannot EXECUTE the task helper -- the grant did not land';
  end if;
  raise notice 'grants: service_role yes, anon and authenticated no';
end
$post$;

commit;
