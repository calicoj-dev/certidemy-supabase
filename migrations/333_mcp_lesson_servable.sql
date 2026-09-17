-- 333_mcp_lesson_servable.sql
--
-- THE GATE STARTS ENFORCING. 332 added the columns and the trigger and
-- deliberately left the views alone so the scanner could populate first and the
-- served surface never went dark. The scan has run: 1,437 rows measured, every
-- verdict coherent with the policy, 479 lesson groups consistent across their
-- three languages.
--
-- This adds ONE predicate to `mcp.lesson`:
--
--     and l.mcp_servable
--
-- and adds `body_available` to `mcp.lesson_index`.
--
-- ===================== WHY THE INDEX STILL LISTS WHAT THE VIEW WITHHOLDS =====================
--
-- `mcp.lesson_index` is the catalogue -- module and lesson titles, slugs,
-- ordering, duration. It carries NO body, it is Certidemy's own expression, and
-- `list_lessons` serves it without a credential.
--
-- A lesson whose body may not be redistributed still EXISTS as a product. A
-- human can buy the course and read it. So hiding it from the catalogue would
-- misrepresent the curriculum to no purpose, and would do it in the one
-- direction that is hard to notice: the syllabus would simply look shorter.
--
-- BUT LISTING IT WITHOUT SAYING SO SETS UP A GUARANTEED FAILURE. An agent reads
-- the catalogue, asks for the body, and gets nothing back -- which through a
-- zero-row result is indistinguishable from "no such lesson". That is the
-- silent-success shape: a true statement ("not found") that is the wrong answer
-- to the question asked.
--
-- So `body_available` is on the index, and `courseware-read` uses it to tell a
-- WITHHELD lesson from an ABSENT one. Refuse, and say which.
--
-- ===================== WHAT THIS DOES NOT DO =====================
--
-- It does not widen the certification list. ISMS-F is now clean -- 147 rows,
-- 0 refused, longest run 9 words -- but it is not in `allowed` and this
-- migration does not put it there. Going live is a separate decision from
-- being eligible to go live, and collapsing the two is how a content gate
-- becomes a release mechanism nobody reviewed.
--
-- ISMS-F PASSES BY ONE WORD. Its longest remaining run is 9 against a threshold
-- of 10. That is worth knowing before anyone proposes tightening the policy:
-- a move to 8 would refuse it again.

begin;

do $mig$
declare
  n_srv   integer;
  n_ref   integer;
  n_null  integer;
begin
  -- ============ REFUSE TO ENFORCE ON AN UNPOPULATED CORPUS ============
  --
  -- If the scanner has not run, every lesson still reads mcp_servable = false
  -- and this migration would empty `mcp.lesson` for all eight live
  -- certifications. The view would be syntactically perfect and the curriculum
  -- surface would be gone.
  select count(*) filter (where mcp_servable),
         count(*) filter (where not mcp_servable),
         count(*) filter (where mcp_iso_longest_run is null)
    into n_srv, n_ref, n_null
    from public.lessons;

  if n_null > 0 then
    raise exception '% lesson(s) have never been scanned', n_null
      using hint = 'run scripts/scan-iso-leaks.mjs --apply before this migration';
  end if;
  if n_srv = 0 then
    raise exception 'no lesson is servable; enforcing now would empty mcp.lesson';
  end if;
  raise notice 'servable %, refused %', n_srv, n_ref;
end
$mig$;

-- ------------------------------------------------- the views, dropped and made
--
-- DROP AND CREATE rather than CREATE OR REPLACE, because lesson_index gains a
-- COLUMN and Postgres will not replace a view whose output list changed. 325
-- already paid for this on these same views; the grants and comments below are
-- restated for the same reason they were restated there -- a drop takes them
-- silently and the next person reading pg_catalog gets nothing.

drop view if exists mcp.lesson;
drop view if exists mcp.lesson_index;

create view mcp.lesson_index
with (security_barrier = true) as
select c.code as certification,
       m.slug as module_slug, m.title as module_title,
       m.order_index as module_order,
       l.slug as lesson_slug, l.title as lesson_title,
       l.language, l.lesson_group_id,
       l.order_index as lesson_order, l.estimated_minutes,
       l.mcp_servable as body_available
  from public.lessons l
  join public.modules m        on m.id = l.module_id
  join public.certifications c on c.id = m.certification_id
 where c.code = any ('{AISM-I,AIE-I,AIHR-I,AIGRM-I,SM-AI-I,SM-AI-II,SPO-AI-I,SD-AI-I}'::text[]);

create view mcp.lesson
with (security_barrier = true) as
select c.code as certification,
       m.slug as module_slug, m.title as module_title,
       m.order_index as module_order,
       l.slug as lesson_slug, l.title as lesson_title,
       l.language, l.lesson_group_id,
       l.order_index as lesson_order, l.estimated_minutes,
       l.content_md
  from public.lessons l
  join public.modules m        on m.id = l.module_id
  join public.certifications c on c.id = m.certification_id
 where c.code = any ('{AISM-I,AIE-I,AIHR-I,AIGRM-I,SM-AI-I,SM-AI-II,SPO-AI-I,SD-AI-I}'::text[])
   -- THE GATE. One predicate, in the object the paywalled role reads, so no
   -- function can serve a withheld body by forgetting a check.
   and l.mcp_servable;

comment on view mcp.lesson is
  'Lesson bodies for the paywalled MCP tool. Excludes any lesson whose body reproduces ISO clause text: see public.mcp_leak_policy and IP-POSITION section 6.';
comment on view mcp.lesson_index is
  'Lesson catalogue, no bodies, no credential. body_available says whether mcp.lesson will return this one, so a withheld lesson can be told from an absent one.';

grant select on mcp.lesson_index to mcp_reader;
grant select on mcp.lesson       to mcp_holder;

-- ===================== POST-CONDITIONS =====================

do $mig$
declare
  n_body   integer;
  n_index  integer;
  n_hidden integer;
  leaked   integer;
begin

  -- 1. THE SERVED SURFACE IS STILL THERE. The whole risk of this migration.
  select count(*) into n_body  from mcp.lesson;
  select count(*) into n_index from mcp.lesson_index;
  if n_body = 0 then
    raise exception 'mcp.lesson is empty';
  end if;
  raise notice 'mcp.lesson % rows, mcp.lesson_index % rows', n_body, n_index;

  -- 2. AND NOTHING WAS LOST. The eight certifications carry no refusals, so the
  --    body view and the index must agree exactly. A difference here means the
  --    gate closed on live content.
  if n_body <> n_index then
    select count(*) into n_hidden from mcp.lesson_index where not body_available;
    raise exception 'index % vs body %, % withheld -- the gate closed on served content',
      n_index, n_body, n_hidden;
  end if;

  -- 3. THE NEGATIVE HALF, AND IT IS THE ONE THAT MATTERS. Every row the view
  --    returns must be marked servable. Asserting the count alone would pass on
  --    a view that dropped the predicate.
  select count(*) into leaked
    from mcp.lesson v
    join public.lessons l
      on l.slug = v.lesson_slug and l.language = v.language
   where not l.mcp_servable;
  if leaked <> 0 then
    raise exception '% row(s) in mcp.lesson are not servable', leaked;
  end if;
  raise notice 'every row in mcp.lesson is marked servable';

  -- 4. body_available IS ACTUALLY POPULATED, both values present somewhere in
  --    the table. A column that is true everywhere cannot distinguish anything,
  --    and the four ISO certifications are outside these views -- so this is
  --    checked on public.lessons, where the false rows live.
  select count(*) into n_hidden from public.lessons where not mcp_servable;
  if n_hidden = 0 then
    raise exception 'no lesson anywhere is unservable; the gate cannot be shown to work';
  end if;
  raise notice '% lesson row(s) withheld platform-wide, none of them in the views', n_hidden;

  -- 5. AND THE ROLES ARE UNCHANGED. A drop takes grants with it, silently.
  if not has_table_privilege('mcp_holder', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_holder lost SELECT on mcp.lesson';
  end if;
  if not has_table_privilege('mcp_reader', 'mcp.lesson_index', 'SELECT') then
    raise exception 'mcp_reader lost SELECT on mcp.lesson_index';
  end if;
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can read lesson bodies -- the paywall is open';
  end if;
  if has_table_privilege('anon', 'mcp.lesson', 'SELECT')
     or has_table_privilege('authenticated', 'mcp.lesson', 'SELECT') then
    raise exception 'anon or authenticated can read lesson bodies';
  end if;
  raise notice 'grants intact: holder reads bodies, reader reads the catalogue only';

  raise notice 'the gate is enforcing';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
--   select count(*) from mcp.lesson;         -- expect 951
--   select count(*) from mcp.lesson_index;   -- expect 951, equal
--
--   select count(*) filter (where mcp_servable) as servable,
--          count(*) filter (where not mcp_servable) as withheld
--     from public.lessons;
--   -- expect 1227 servable, 210 withheld (all four ISO certs, none in the views)
--
--   select relname, has_table_privilege('mcp_holder', oid, 'SELECT') as holder,
--          has_table_privilege('mcp_reader', oid, 'SELECT') as reader
--     from pg_class where relnamespace = 'mcp'::regnamespace and relname like 'lesson%';
--   -- expect lesson: holder t / reader f; lesson_index: holder ? / reader t
--
-- NEXT: the serve-time backstop in courseware-read, which distinguishes a
-- WITHHELD lesson from an ABSENT one and logs a hit as an incident.
