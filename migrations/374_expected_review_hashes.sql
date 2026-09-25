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
--     ISMS-F task 5.2 went dark in both languages for 44 seconds.
--
-- CLAUDE.md already carried the rule -- recompute with the function that WROTE
-- the value. Both slips happened anyway, by sessions that had read it. A rule
-- broken twice in one day is a rule without a mechanism.
--
-- So the expressions move OUT of the writers and INTO one read-only function per
-- arm, built from the SAME expressions the gate evaluates. A writer asks; it does
-- not know the formula and cannot get it wrong.
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
begin
  -- ============ THE FIXTURE ============
  --
  -- For every APPROVED review row whose subject the gate currently serves, what
  -- the helper returns MUST equal what the review stored. That is the whole
  -- claim: the helper speaks for the gate.
  --
  -- Only rows the gate ACCEPTS are compared. A stale review is stale on purpose
  -- -- that is the gate working -- and folding those in would make this assert
  -- the opposite of what it means.

  -- LESSON arm
  select count(*),
         count(*) filter (where r.en_hash = e.en_hash and r.tr_hash = e.tr_hash),
         string_agg(l.slug || '/' || l.language, ', ')
           filter (where r.en_hash <> e.en_hash or r.tr_hash <> e.tr_hash)
    into v_total, v_agree, v_bad
    from public.lesson_translation_reviews r
    join public.lessons l on l.id = r.lesson_id
    cross join lateral public.expected_review_hashes_lesson(l.id) e
   where r.verdict = 'approved'
     and public.lesson_body_is_servable(l.id);
  if v_total > 0 and v_agree <> v_total then
    raise exception 'lesson arm: % of % approved+serving review(s) disagree with the helper: %',
      v_total - v_agree, v_total, coalesce(v_bad, '?');
  end if;
  raise notice 'lesson arm: %/% approved+serving reviews agree', v_agree, v_total;

  -- TASK arm
  select count(*),
         count(*) filter (where r.en_hash = e.en_hash and r.tr_hash = e.tr_hash),
         string_agg(tt.id::text || '/' || tt.language, ', ')
           filter (where r.en_hash <> e.en_hash or r.tr_hash <> e.tr_hash)
    into v_total, v_agree, v_bad
    from public.task_translation_reviews r
    join public.task_translations tt on tt.id = r.task_translation_id
    cross join lateral public.expected_review_hashes_task(tt.id) e
   where r.verdict = 'approved'
     and not public.task_ksa_is_withheld(tt.id);
  if v_total > 0 and v_agree <> v_total then
    raise exception 'task arm: % of % approved+serving review(s) disagree with the helper: %',
      v_total - v_agree, v_total, coalesce(v_bad, '?');
  end if;
  raise notice 'task arm: %/% approved+serving reviews agree', v_agree, v_total;

  -- CONCEPT arm. Its hashes are the GATE'S OWN STORED VALUES on
  -- concept_translations, not a review table, so the comparison is against the
  -- rows the view currently joins.
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
  if v_total > 0 and v_agree <> v_total then
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
