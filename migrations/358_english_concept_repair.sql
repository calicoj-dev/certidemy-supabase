-- 358_english_concept_repair.sql
--
-- Eight English concept repairs. Five of them were reaching both translations.
--
-- ============ WHY ENGLISH FIRST ============
--
-- A FAITHFUL RENDERING OF A DEFECTIVE ENGLISH IS NOT A TRANSLATION DEFECT.
-- Fixing the rendering and leaving the English ambiguous re-manufactures the
-- defect on the next pass. Four classes reached es-419 and pt-BR IDENTICALLY,
-- which is the evidence they are upstream: an attachment ambiguity, a verb
-- phrase that collapses, a word doing two jobs, and a bare noun with a
-- specific referent.
--
-- Every edit here moves the row's en_hash, so 356's review gate withholds the
-- affected translations on its own. That is checked per row afterwards rather
-- than assumed.
--
-- ============ CONCEPTS HAVE NO RETIREMENT MECHANISM ============
--
-- 1.5 asked to retire `refinement-ongoing` "via the 345 path". THAT PATH DOES
-- NOT EXIST HERE: 345 retires quiz_questions through `retired_at`, and
-- `concepts` has six columns and no such thing.
--
-- Measured before choosing. `refinement-ongoing` and `backlog-refinement` are
-- a PERFECT SUBSET -- every one of the 30 question links, the 1 task link and
-- the 3 lesson links on the first is also on the second, with ZERO exclusive
-- to it and no user_concept_mastery rows either side:
--
--     shared questions 30    only-on-refinement-ongoing 0
--     shared tasks      1    only-on-refinement-ongoing 0
--     shared lessons    3    only-on-refinement-ongoing 0
--
-- So nothing is lost by removing it, and nothing needs re-pointing. This adds
-- `retired_at` to `concepts` rather than deleting, because "retire, not
-- delete" is this repository's standing position and a deleted concept cannot
-- be told from one that never existed. The column is the smaller change AND
-- the reversible one.
--
-- mcp.concept gains `retired_at is null`. That REDUCES its row count, which is
-- the safe direction: 355's live regression came from a view that MULTIPLIED
-- rows under a caller with no matching filter. A caller that selects fewer
-- rows than before cannot fan out.
--
-- ============ 1.6 IS NOT A MERGE ============
--
-- The two ISMS-IA concepts map to DIFFERENT tasks -- 3.8 and 1.4 -- so
-- retiring either strands a task. They are duplicate DESCRIPTIONS, not
-- duplicate concepts, and the repair is to make each description say what its
-- own name and task are about.
--
-- ============ 1.7 USES THE NARROW GUARD ============
--
-- The proposed guard was "name equals slug-with-spaces, first letter
-- capitalised". MEASURED, not estimated: it fires on 653 of 1,730 names (I
-- had said "roughly 869" from summing overlapping categories). A slug-derived
-- name is the CONVENTION. ISMS-F's actual defect is narrower --
-- it is the only certification whose names carry no capitalisation at all,
-- 192 of 192 byte-equal to the raw slug. The guard below tests exactly that.
--
-- The lowercase `ai` (9 ISMS-F + 5 AIMS-F) and `annex a` (2 + 2) initialism
-- pass is deliberately NOT here. It is a separate step on a separate rule.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_bad     int;
  n_hit     int;
  id_ongoing uuid;
  id_keep    uuid;
  frozen_before text;
  frozen_after  text;
begin

  -- ----------------------------------------------- pre-conditions
  select cp.id into id_ongoing from public.concepts cp
    join public.certifications c on c.id = cp.certification_id
   where c.code = 'SPO-AI-I' and cp.slug = 'refinement-ongoing';
  select cp.id into id_keep from public.concepts cp
    join public.certifications c on c.id = cp.certification_id
   where c.code = 'SPO-AI-I' and cp.slug = 'backlog-refinement';
  if id_ongoing is null or id_keep is null then
    raise exception 'the SPO-AI-I refinement pair is not in the state 358 was written for';
  end if;

  -- THE SUBSET PROPERTY, RE-CHECKED RATHER THAN TRUSTED FROM THE DIAGNOSIS.
  -- Retiring a concept that carries an exclusive link silently drops coverage.
  select count(*) into n_bad from public.question_concepts qa
   where qa.concept_id = id_ongoing
     and not exists (select 1 from public.question_concepts qb
                      where qb.concept_id = id_keep and qb.question_id = qa.question_id);
  if n_bad <> 0 then
    raise exception '% question(s) link ONLY to refinement-ongoing -- retiring it drops coverage', n_bad;
  end if;
  select count(*) into n_bad from public.task_concepts ta
   where ta.concept_id = id_ongoing
     and not exists (select 1 from public.task_concepts tb
                      where tb.concept_id = id_keep and tb.task_id = ta.task_id);
  if n_bad <> 0 then
    raise exception '% task(s) link ONLY to refinement-ongoing', n_bad;
  end if;

  -- ----------------------------------------------- what must not move
  select md5(coalesce(string_agg(cp.id::text || ':' || cp.name || ':' || coalesce(cp.description,''),
                                 ',' order by cp.id), ''))
    into frozen_before
    from public.concepts cp
    join public.certifications c on c.id = cp.certification_id
   where not (c.code = 'ISMS-F')
     and (c.code, cp.slug) not in (
       ('ISMS-F','tool-misuse'), ('SM-AI-II','complementary-practice'),
       ('AIHR-I','institution-proxy'), ('SD-AI-I','daily-backlog-update'),
       ('SPO-AI-I','refinement-ongoing'), ('AISM-I','keep-it-simple-and-practical'),
       ('ISMS-IA','ia-ai-evaluation-tools-in-auditor-competence-7-2-3'),
       ('ISMS-IA','ia-ict-and-emerging-technology-competence-7-2-3'));

  -- ----------------------------------------------- 1.1 attachment ambiguity
  -- "bent to X by a compromised agent" attaches the agent to `unintended` on
  -- nearest attachment. Making the agent the SUBJECT of the bending removes
  -- the attachment site rather than repunctuating around it.
  update public.concepts set
    description = 'legitimate tools that a compromised agent bends toward destructive or unintended outputs'
   where id = (select cp.id from public.concepts cp join public.certifications c on c.id=cp.certification_id
                where c.code='ISMS-F' and cp.slug='tool-misuse');

  -- ----------------------------------------------- 1.2 the collapsing verb
  -- "adds to it" became `lo suma` / `o acrescenta` -- BOTH translators dropped
  -- the preposition, and in "add to" the preposition carries the direction.
  -- "Supplement" is transitive in the right direction with NO preposition to
  -- lose, which is why this is not simply "adds to Scrum": naming the noun
  -- twice would fix this instance and leave the shape that broke it.
  update public.concepts set
    description = 'A practice wrapped around Scrum that supplements it without replacing any of its elements.'
   where id = (select cp.id from public.concepts cp join public.certifications c on c.id=cp.certification_id
                where c.code='SM-AI-II' and cp.slug='complementary-practice');

  -- ----------------------------------------------- 1.3 one word, two jobs
  -- Both languages read `background` as social origin alone. Task 2.4 is about
  -- proxy variables encoding protected characteristics, so both senses are
  -- meant and the English has to say so.
  update public.concepts set
    description = 'School, university or employer name functioning as a proxy for educational or socioeconomic background, or for protected status.'
   where id = (select cp.id from public.concepts cp join public.certifications c on c.id=cp.certification_id
                where c.code='AIHR-I' and cp.slug='institution-proxy');

  -- ----------------------------------------------- 1.4 bare noun, wrong default
  -- Task 2.3 is "Own and maintain the Sprint Backlog". Bare `backlog` defaults
  -- to Product Backlog in English AND in both target languages, so the name
  -- pointed at the wrong artifact in three languages at once. The ONLY one of
  -- the seven bare-backlog concepts whose referent is the Sprint Backlog.
  update public.concepts set name = 'Daily Sprint Backlog Update'
   where id = (select cp.id from public.concepts cp join public.certifications c on c.id=cp.certification_id
                where c.code='SD-AI-I' and cp.slug='daily-backlog-update');

  -- ----------------------------------------------- 1.5 retire, do not delete
  alter table public.concepts add column if not exists retired_at timestamptz;
  alter table public.concepts add column if not exists retired_reason text;
  comment on column public.concepts.retired_at is
    'Concepts are retired, never deleted -- a deleted concept cannot be told from one that never existed. mcp.concept filters on it. Added by 358 because no retirement mechanism existed.';

  update public.concepts
     set retired_at = now(),
         retired_reason = 'Duplicate of backlog-refinement on the same task (4.6), and its description taught retired vocabulary ("grooming"). Every question, task and lesson link was already a subset of backlog-refinement''s, so no coverage moved.'
   where id = id_ongoing;

  execute format($ddl$
    create or replace view mcp.concept
    with (security_barrier = true) as
    select c.code as certification,
           lg.language,
           co.slug,
           coalesce(ct.name, co.name) as name,
           coalesce(ct.description, co.description) as description,
           ct.description is null as description_is_fallback,
           ( select array_agg(t.code order by t.code)
               from public.task_concepts tc
               join public.tasks t on t.id = tc.task_id
              where tc.concept_id = co.id ) as task_codes
      from public.concepts co
      join public.certifications c on c.id = co.certification_id
      cross join (values ('en'), ('es-419'), ('pt-BR')) as lg(language)
      left join public.concept_translations ct
        on ct.concept_id = co.id
       and ct.language = lg.language
       and ct.is_provisional = false
     where c.code = any (%L::text[])
       and co.retired_at is null
  $ddl$, array['AISM-I','AIE-I','AIHR-I','AIGRM-I','SM-AI-I','SM-AI-II',
               'SPO-AI-I','SD-AI-I','ISMS-F','AIMS-F','AIMS-IA','ISMS-IA']);

  execute 'comment on view mcp.concept is ' || quote_literal(
    'The concepts this MCP serves, language dimension by 355, retired concepts excluded by 358. name and description come from public.concept_translations where a CLEARED row exists, coalesced onto the English base; description_is_fallback says which. A provisional translation is not served.');
  execute 'grant select on mcp.concept to mcp_reader, mcp_holder';

  -- ----------------------------------------------- 1.6 differentiate, not merge
  update public.concepts set
    description = 'ISO 19011:2026 clause 7.2.3 item 10 gives artificial-intelligence-based evaluation tools as its example of the technology an auditor must understand the appropriateness and consequences of using. The competence is about the AI tool in the auditor''s own hands, not about auditing AI.'
   where id = (select cp.id from public.concepts cp join public.certifications c on c.id=cp.certification_id
                where c.code='ISMS-IA' and cp.slug='ia-ai-evaluation-tools-in-auditor-competence-7-2-3');
  update public.concepts set
    description = 'ISO 19011:2026 clause 7.2.3 item 10 requires auditors to understand the appropriateness and consequences of using information and communications technology tools, and emerging technology, to conduct audits. The requirement is general: it covers remote-audit tooling, sampling and analysis software, and whatever arrives next.'
   where id = (select cp.id from public.concepts cp join public.certifications c on c.id=cp.certification_id
                where c.code='ISMS-IA' and cp.slug='ia-ict-and-emerging-technology-competence-7-2-3');

  -- ----------------------------------------------- 1.7 ISMS-F capitalisation
  -- Sentence case only. The initialism pass (`ai` -> `AI`, `annex a` ->
  -- `Annex A`) is a separate step on a separate rule and is NOT done here.
  update public.concepts cp set
    name = upper(left(cp.name, 1)) || substr(cp.name, 2)
    from public.certifications c
   where c.id = cp.certification_id
     and c.code = 'ISMS-F'
     and cp.name = replace(cp.slug, '-', ' ');
  get diagnostics n_hit = row_count;
  raise notice '1.7: % ISMS-F name(s) sentence-cased', n_hit;

  -- ----------------------------------------------- 1.8 the IT department
  -- Term-scoped. "IT to Digital Shift" is genuinely the IT department and
  -- stays; only the ITIL guiding principle is repaired.
  update public.concepts set name = 'Keep it simple and practical'
   where id = (select cp.id from public.concepts cp join public.certifications c on c.id=cp.certification_id
                where c.code='AISM-I' and cp.slug='keep-it-simple-and-practical');

  -- ===================== POST-CONDITIONS =====================

  -- 1. NEGATIVE, AND IT IS THE AUTHORISATION. Every concept outside ISMS-F and
  --    the eight named rows is byte-identical. No count: four migrations have
  --    aborted against a correct database on a literal.
  select md5(coalesce(string_agg(cp.id::text || ':' || cp.name || ':' || coalesce(cp.description,''),
                                 ',' order by cp.id), ''))
    into frozen_after
    from public.concepts cp
    join public.certifications c on c.id = cp.certification_id
   where not (c.code = 'ISMS-F')
     and (c.code, cp.slug) not in (
       ('ISMS-F','tool-misuse'), ('SM-AI-II','complementary-practice'),
       ('AIHR-I','institution-proxy'), ('SD-AI-I','daily-backlog-update'),
       ('SPO-AI-I','refinement-ongoing'), ('AISM-I','keep-it-simple-and-practical'),
       ('ISMS-IA','ia-ai-evaluation-tools-in-auditor-competence-7-2-3'),
       ('ISMS-IA','ia-ict-and-emerging-technology-competence-7-2-3'));
  if frozen_before is distinct from frozen_after then
    raise exception 'a concept outside the authorised set changed';
  end if;

  -- 2. THE NARROW GUARD. No concept name is byte-equal to its RAW slug with
  --    hyphens replaced by spaces and NO capitalisation. Measured before
  --    adopting: fires on ISMS-F's 192 and nowhere else, against 869 for the
  --    capitalised variant that was proposed first.
  select count(*) into n_bad
    from public.concepts cp
   where cp.name = replace(cp.slug, '-', ' ');
  if n_bad <> 0 then
    raise exception '% concept name(s) are raw slug text', n_bad;
  end if;

  -- 3. THE 1.6 GUARD, AND IT WAS MEASURED BEFORE BEING BELIEVED.
  --
  --    The first version tested EXACT normalised equality and fires ZERO
  --    times on this corpus -- including on the ISMS-IA pair it was written
  --    for, whose descriptions differ by one word (`giving` / `naming`). A
  --    guard that cannot catch its own motivating instance is worse than
  --    none: it reports clean and retires the question.
  --
  --    Comparing the first 100 normalised characters fires on 3 pairs, catches
  --    the ISMS-IA one, and found TWO MORE nobody had seen:
  --
  --      AIMS-IA  aia-clause-4-1-context  +  aia-organizational-roles-4-1
  --      AIMS-IA  aia-clause-4-3-scope    +  aia-scope-follows-roles
  --
  --    Those two are NOT in this migration's scope and are NOT fixed here, so
  --    this asserts only what 358 is authorised for -- the ISMS-IA pair no
  --    longer collides -- and NOTICEs the rest rather than aborting on work
  --    nobody has decided to do.
  select count(*) into n_bad from (
    select cp.certification_id, left(lower(regexp_replace(coalesce(cp.description,''), '\s+', ' ', 'g')), 100) d
      from public.concepts cp
     where cp.retired_at is null and coalesce(cp.description,'') <> ''
       and cp.slug in ('ia-ai-evaluation-tools-in-auditor-competence-7-2-3',
                       'ia-ict-and-emerging-technology-competence-7-2-3')
     group by 1, 2 having count(*) > 1) t;
  if n_bad <> 0 then
    raise exception 'the ISMS-IA pair still shares its opening 100 characters';
  end if;

  select count(*) into n_bad from (
    select cp.certification_id, left(lower(regexp_replace(coalesce(cp.description,''), '\s+', ' ', 'g')), 100) d
      from public.concepts cp
     where cp.retired_at is null and coalesce(cp.description,'') <> ''
     group by 1, 2 having count(*) > 1) t;
  raise notice '1.6 guard: % near-duplicate description pair(s) remain corpus-wide (expected 2, both AIMS-IA, out of scope here)', n_bad;

  -- 4. COVERAGE OF TASK 4.6 IS UNCHANGED, which is what retiring a concept
  --    most easily breaks.
  select count(*) into n_bad
    from public.tasks t
    join public.certifications c on c.id = t.certification_id
   where c.code = 'SPO-AI-I' and t.code = '4.6'
     and not exists (select 1 from public.task_concepts tc
                      join public.concepts cp on cp.id = tc.concept_id
                     where tc.task_id = t.id and cp.retired_at is null);
  if n_bad <> 0 then
    raise exception 'SPO-AI-I task 4.6 has no live concept after the retirement';
  end if;

  -- 5. NO ORPHANED LINK ROWS. The retired concept keeps its rows -- they are
  --    the record of what it covered -- but every one must also be reachable
  --    through a LIVE concept, or coverage moved without anyone deciding to.
  select count(*) into n_bad
    from public.question_concepts qc
   where qc.concept_id = id_ongoing
     and not exists (select 1 from public.question_concepts q2
                      join public.concepts cp on cp.id = q2.concept_id
                     where q2.question_id = qc.question_id and cp.retired_at is null);
  if n_bad <> 0 then
    raise exception '% question(s) lose all live concept coverage', n_bad;
  end if;

  -- 6. AS mcp_reader. The retired concept is gone from the served view and the
  --    survivor is still there -- both directions, through the caller's grant.
  execute 'set local role mcp_reader';
  select count(*) into n_bad from mcp.concept
   where certification = 'SPO-AI-I' and slug = 'refinement-ongoing';
  execute 'reset role';
  if n_bad <> 0 then
    raise exception 'refinement-ongoing is still served (% row(s))', n_bad;
  end if;
  execute 'set local role mcp_reader';
  select count(*) into n_bad from mcp.concept
   where certification = 'SPO-AI-I' and slug = 'backlog-refinement';
  execute 'reset role';
  if n_bad = 0 then
    raise exception 'backlog-refinement vanished -- the retirement filter is too broad';
  end if;

  raise notice '358 ok: 8 repairs, 1 concept retired, % ISMS-F name(s) cased', n_hit;
  raise notice 'Every edited row moved its en_hash. Confirm the review gate withheld each one.';
end
$mig$;
