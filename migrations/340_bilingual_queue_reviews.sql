-- 340_bilingual_queue_reviews.sql
--
-- Record the bilingual review of 35 lesson translations, THROUGH
-- `lesson_translation_reviews` rather than by touching a flag.
--
-- ============ WHAT WAS REVIEWED ============
--
-- BILINGUAL-QUEUE.json held 58 paragraphs across 35 rows: every repaired
-- paragraph inside a review-gated row whose translation the provenance record
-- said PREDATES its English repair. The reviewer worked all 58 on 2026-09-17.
--
--   43 clean   faithful renderings of the repaired English
--   15 edited  landed as 19 literal substitutions by
--              scripts/apply-queue-edits.mjs, with no model call
--
-- The other 173 gated rows are NOT touched here. They were not in the queue and
-- have not been read. Post-condition 4 asserts exactly that.
--
-- ============ WHY THIS IS A MIGRATION AND NOT A SCRIPT ============
--
-- The hash has to be the one `mcp.lesson` computes. 335's predicate reads
-- `left(md5(en.content_md), 8)`, and computing that anywhere but in Postgres
-- means hoping two engines agree about bytes that travelled through JSON.
-- Written here, in SQL, it matches BY CONSTRUCTION rather than by luck.
--
-- THAT WAS NOT THE FIRST PLAN. The hash was going to be computed in Node, and
-- the attempt to validate that was safe came up empty twice:
-- `lesson_translation_reviews` had ZERO rows to reproduce, and
-- `item_translation_reviews` uses a DIFFERENT definition -- sha256 via pgcrypto
-- over `question_text || options::text || explanation`, concatenated WITH NO
-- SEPARATOR, which is the defect 339's length-prefixed hash exists to avoid.
-- With nothing to validate against, the computation moved to where the question
-- does not arise.
--
-- ============ AND THE FLAG STAYS TRUE ============
--
-- `mcp_translation_review_required` is NOT cleared. It records that these rows
-- were once withheld by a leak repair, which remains true. The review is what
-- opens the gate, and only while its `en_hash` still matches -- so a later
-- English edit closes it again with nobody remembering to. That is why 335 was
-- built this way, why 339 repeated it for task KSAs, and why "clear the flag"
-- is the one thing this migration does not do.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  REVIEWER text := 'jroman.mobile@gmail.com';
  NOTE     text :=
    'Bilingual queue worked in full on 2026-09-17: 58 paragraphs across 35 rows, ' ||
    '43 clean, 15 edited (19 literal substitutions, applied by ' ||
    'scripts/apply-queue-edits.mjs with no model call). The queue listed every ' ||
    'repaired paragraph whose translation predated its English repair, from ' ||
    'scripts/audit-review-gate.mjs. Read by the reviewer named here.';
  n        int;
  n_before int;
  n_after  int;
begin

  select count(*) into n_before from public.lesson_translation_reviews;
  raise notice 'lesson_translation_reviews holds % row(s) before this migration', n_before;

  create temporary table _reviewed (slug text, language text) on commit drop;
  insert into _reviewed (slug, language) values
      ('aims-ia-02-07-the-programme-audits-itself','es-419'),
      ('aims-ia-03-03-what-the-sample-supports','es-419'),
      ('aims-ia-03-03-what-the-sample-supports','pt-BR'),
      ('aims-ia-03-04-demonstrated-not-described','pt-BR'),
      ('aims-ia-03-06-what-a-screen-share-establishes','es-419'),
      ('aims-ia-03-06-what-a-screen-share-establishes','pt-BR'),
      ('aims-ia-04-03-leadership-in-artifacts','es-419'),
      ('aims-ia-04-03-leadership-in-artifacts','pt-BR'),
      ('aims-ia-04-04-criteria-before-assessment','es-419'),
      ('aims-ia-04-04-criteria-before-assessment','pt-BR'),
      ('aims-ia-04-05-controls-first-annex-a-second','pt-BR'),
      ('aims-ia-04-06-two-assessments-not-one','es-419'),
      ('aims-ia-04-07-controlled-not-merely-present','pt-BR'),
      ('aims-ia-04-08-defined-versus-running','pt-BR'),
      ('aims-ia-04-09-normative-and-should','es-419'),
      ('aims-ia-04-09-normative-and-should','pt-BR'),
      ('aims-ia-04-10-justifying-both-directions','es-419'),
      ('aims-ia-04-10-justifying-both-directions','pt-BR'),
      ('aims-ia-04-13-competence-the-organization-claims','pt-BR'),
      ('aims-ia-05-05-a-report-for-someone-not-in-the-room','es-419'),
      ('aims-ia-05-05-a-report-for-someone-not-in-the-room','pt-BR'),
      ('aims-ia-05-06-correction-is-not-corrective-action','pt-BR'),
      ('aims-ia-05-07-where-the-audit-lands','es-419'),
      ('aims-ia-05-07-where-the-audit-lands','pt-BR'),
      ('isms-ia-01-02-principles-in-tension','pt-BR'),
      ('isms-ia-02-04-choosing-the-method','es-419'),
      ('isms-ia-02-04-choosing-the-method','pt-BR'),
      ('isms-ia-02-06-testing-the-programme','pt-BR'),
      ('isms-ia-04-02-demonstrated-not-stated','pt-BR'),
      ('isms-ia-04-04-tracing-the-soa-back','es-419'),
      ('isms-ia-04-04-tracing-the-soa-back','pt-BR'),
      ('isms-ia-04-06-defined-versus-running','es-419'),
      ('isms-ia-04-06-defined-versus-running','pt-BR'),
      ('isms-ia-04-07-two-sentences','es-419'),
      ('isms-ia-04-07-two-sentences','pt-BR');

  -- ------------------------------------------------- pre-conditions

  select count(*) into n from _reviewed;
  if n <> 35 then
    raise exception 'the reviewed list holds % pair(s), expected 35', n;
  end if;

  -- EVERY PAIR MUST RESOLVE TO EXACTLY ONE ROW. A pair matching nothing would
  -- make this a smaller review than the one that was made, silently, and a pair
  -- matching two would record a judgement about a row nobody opened.
  select count(*) into n
    from _reviewed r
   where (select count(*) from public.lessons l
           where l.slug = r.slug and l.language = r.language) <> 1;
  if n <> 0 then
    raise exception '% reviewed pair(s) do not resolve to exactly one lesson row', n;
  end if;

  -- Every one must have an English sibling, or there is nothing to hash.
  select count(*) into n
    from _reviewed r
    join public.lessons l on l.slug = r.slug and l.language = r.language
   where not exists (select 1 from public.lessons en
                      where en.lesson_group_id = l.lesson_group_id and en.language = 'en');
  if n <> 0 then
    raise exception '% reviewed row(s) have no English sibling', n;
  end if;

  -- And every one must currently be gated, or the list has drifted from the
  -- state the queue was built against.
  select count(*) into n
    from _reviewed r
    join public.lessons l on l.slug = r.slug and l.language = r.language
   where l.mcp_translation_review_required is not true;
  if n <> 0 then
    raise exception '% reviewed row(s) are not flagged for review', n;
  end if;

  -- ------------------------------------------------- the reviews
  --
  -- en_hash computed HERE, with the expression mcp.lesson's predicate uses.
  insert into public.lesson_translation_reviews
    (lesson_id, reviewed_by, en_hash, verdict, note)
  select l.id, REVIEWER, left(md5(en.content_md), 8), 'approved', NOTE
    from _reviewed r
    join public.lessons l  on l.slug = r.slug and l.language = r.language
    join public.lessons en on en.lesson_group_id = l.lesson_group_id
                          and en.language = 'en'
  on conflict do nothing;

  select count(*) into n_after from public.lesson_translation_reviews;
  raise notice 'inserted % review row(s)', n_after - n_before;

  -- ===================== POST-CONDITIONS =====================

  -- 1. THIRTY-FIVE, ALL FROM THIS REVIEWER, ALL APPROVED.
  select count(*) into n from public.lesson_translation_reviews where reviewed_by = REVIEWER;
  if n <> 35 then
    raise exception 'expected 35 review row(s) for the reviewer, found %', n;
  end if;
  select count(*) into n from public.lesson_translation_reviews
   where reviewed_by = REVIEWER and verdict <> 'approved';
  if n <> 0 then
    raise exception '% review row(s) are not approved', n;
  end if;

  -- 2. EVERY HASH MATCHES ITS ENGLISH. True the moment it is written, and
  --    asserted because a hash that did NOT match would be a review that opens
  --    nothing while looking exactly like one that does.
  select count(*) into n
    from public.lesson_translation_reviews rv
    join public.lessons l  on l.id = rv.lesson_id
    join public.lessons en on en.lesson_group_id = l.lesson_group_id and en.language = 'en'
   where rv.reviewed_by = REVIEWER
     and rv.en_hash <> left(md5(en.content_md), 8);
  if n <> 0 then
    raise exception '% review row(s) carry a hash that does not match their English', n;
  end if;

  -- 3. THE BODIES ARE NOW REACHABLE, asserted against the VIEW rather than the
  --    table. This is the only check that proves the hash is the right one.
  select count(*) into n
    from _reviewed r
    join public.lessons l on l.slug = r.slug and l.language = r.language
   where not exists (select 1 from mcp.lesson m
                      where m.lesson_slug = l.slug and m.language = l.language);
  if n <> 0 then
    raise exception '% reviewed row(s) are still not returned by mcp.lesson', n
      using hint = 'Either mcp_servable is false (re-run scan-iso-leaks) or the hash is wrong.';
  end if;
  raise notice 'ok: all 35 reviewed row(s) are returned by mcp.lesson';

  -- 4. THE NEGATIVE HALF, and it is the one that matters. A migration that
  --    opened every gated row would pass 1, 2 and 3 without complaint.
  select count(*) into n
    from public.lessons l
   where l.language <> 'en'
     and l.mcp_translation_review_required is true
     and not exists (select 1 from _reviewed r
                      where r.slug = l.slug and r.language = l.language)
     and exists (select 1 from mcp.lesson m
                  where m.lesson_slug = l.slug and m.language = l.language);
  if n <> 0 then
    raise exception '% gated row(s) OUTSIDE the reviewed list are now reachable', n
      using detail = 'Only the 58 paragraphs in BILINGUAL-QUEUE.json were read.';
  end if;
  raise notice 'ok: no gated row outside the list opened';

  -- 5. AND THE FLAG IS UNTOUCHED. The review is what opens the gate; clearing
  --    the flag as well would throw away the fact that these rows were once
  --    withheld by a repair, and would survive a later English edit.
  select count(*) into n
    from _reviewed r
    join public.lessons l on l.slug = r.slug and l.language = r.language
   where l.mcp_translation_review_required is not true;
  if n <> 0 then
    raise exception '% reviewed row(s) had their flag cleared; it must stay true', n;
  end if;

  raise notice '340 ok: 35 reviews recorded, bodies reachable, nothing else opened, flags intact';
end
$mig$;
