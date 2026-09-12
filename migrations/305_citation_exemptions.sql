-- 305_citation_exemptions.sql
--
-- A CORRECT ITEM MAY NAME A SUPERSEDED EDITION, BECAUSE A CORRECTION HAS TO SAY
-- WHAT IT CORRECTS.
--
-- verify-citations / verify-cert's items.citations flags an item that cites an
-- edition other than the one its grounding declares. Two items trip it and both
-- are RIGHT. They exist to dismiss the very confusion they name:
--
--   AIMS-F secure 4.1    "The 114-control figure is from ISO/IEC 27001:2013."
--   ISMS-IA practice 3.3 a distractor "confuses it with clause A.16 of
--                        ISO/IEC 27001:2013's Annex A, a different document
--                        entirely" - and 2013's A.16 WAS incident management,
--                        which is the whole point of the item.
--
-- This is CLAUDE.md's rule verbatim: the prose a guard checks can quote the
-- thing it forbids. Rewriting either item to satisfy the gate would be the check
-- editing the content. So the gate learns about them instead.
--
-- WHY NOT retired_vocabulary_intent, THE OBVIOUS PRECEDENT. That column marks an
-- ITEM as permitted to be odd. The property here belongs to a CITATION. An item
-- exempted wholesale would also be exempted for a genuine error sitting beside
-- the deliberate one, which is the failure mode of every blanket exemption. It
-- would also mean adding a column to quiz_questions, which drags in CLAUDE.md's
-- five-writer rule for two rows of data.
--
-- WRITER LIST. Nothing writes this table but a migration. It is not referenced
-- by _shared/issue.ts, score-mock-exam, mint-missing-credentials.mjs,
-- mint-specimens.mjs or any edge function; `grep -rn "citation_exemptions"`
-- across both repos returns this file and the two checker scripts, which only
-- READ it. No backfill is required because the table starts empty.
--
-- KEYED ON THE GROUP, NOT THE ROW. A citation mirrors across all three language
-- rows - measured: the tier-1 sweep returns exactly 3x the English figures in
-- every column - so one exemption covers en, es-419 and pt-BR. Keying on
-- quiz_questions.id would need three identical rows and could drift to two.
--
-- Run in the Supabase SQL editor, one block at a time.

-- ============================================================================
-- 1. THE TABLE
-- ============================================================================

create table if not exists public.citation_exemptions (
  question_group_id uuid not null,
  token             text not null,
  reason            text not null,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id),
  primary key (question_group_id, token)
);

-- A REASON IS NOT OPTIONAL AND NOT A SHRUG. The recurring failure mode in this
-- repo is silent success; an exemption with no argument behind it is how a gate
-- quietly stops meaning anything. 40 characters is roughly one clause of
-- justification - enough that "legacy" or "known issue" will not pass.
alter table public.citation_exemptions
  add constraint citation_exemptions_reason_substantive
  check (length(btrim(reason)) >= 40);

-- The token must be the citation as it appears, not a category.
alter table public.citation_exemptions
  add constraint citation_exemptions_token_shape
  check (token ~ '^ISO(/IEC)?(/TS)? [0-9]{4,5}(-[0-9]+)?(:[0-9]{4})?$');

comment on table public.citation_exemptions is
  'Citations a checker would flag that are correct in context. One row per (question group, citation token), with the argument for it. Read by scripts/lib/citation-index.mjs; written only by migrations.';

-- ============================================================================
-- 2. GRANTS AND RLS.
--
--    RLS IS NOT A GRANT - the table-level grant is checked BEFORE row-level
--    security, so a table with RLS enabled and no grant is closed and a table
--    with a grant and no policies is open. This table is read only by
--    service-role scripts, which bypass RLS entirely. So: enable RLS, write no
--    policies, and grant nothing. Both halves are required; either alone is
--    the wrong shape.
-- ============================================================================

alter table public.citation_exemptions enable row level security;

revoke all on public.citation_exemptions from anon, authenticated;

-- ============================================================================
-- 3. THE TWO ROWS
-- ============================================================================

insert into public.citation_exemptions (question_group_id, token, reason) values
  ('aecbc50f-9bb4-4131-a71b-046577d817c6', 'ISO/IEC 27001:2013',
   'AIMS-F secure 4.1 names the 2013 edition to attribute the 114-control figure to it, which is correct and is the misconception the item exists to dismiss.'),
  ('bdfa52fd-923a-473f-a814-e9b86ed4b09e', 'ISO/IEC 27001:2013',
   'ISMS-IA practice 3.3 distinguishes A.16 of ISO 19011:2026 from clause A.16 of the 2013 edition of 27001, whose A.16 was information security incident management. The contrast is the item.')
on conflict (question_group_id, token) do update set reason = excluded.reason;

-- ============================================================================
-- PROOF - both directions.
-- ============================================================================

-- 4. POSITIVE: two rows, both with a real reason, both pointing at a live group.
select e.question_group_id, e.token, length(e.reason) as reason_len,
       c.code, q.pool, t.code as task, count(*) as language_rows
from public.citation_exemptions e
join public.quiz_questions q on q.question_group_id = e.question_group_id
join public.certifications c on c.id = q.certification_id
left join public.tasks t on t.id = q.task_id
where q.retired_at is null
group by 1, 2, 3, 4, 5, 6
order by c.code;

-- 5. POSITIVE: every exempted group really does contain its token, in all three
--    languages. An exemption for a citation the item does not make is dead
--    weight that hides the next real one. Expect 3 and 3.
select e.token, c.code, count(*) as rows_carrying_token
from public.citation_exemptions e
join public.quiz_questions q on q.question_group_id = e.question_group_id
join public.certifications c on c.id = q.certification_id
where q.retired_at is null
  and position(e.token in (q.question_text || coalesce(q.explanation, '') || q.options::text)) > 0
group by 1, 2 order by 2;

-- 6. NEGATIVE: the constraints bite. Both of these MUST raise an error. Run
--    them one at a time and expect 23514 twice; if either succeeds, the check
--    is decorative and this table will fill with unargued exemptions.
--
--    insert into public.citation_exemptions (question_group_id, token, reason)
--    values ('aecbc50f-9bb4-4131-a71b-046577d817c6', 'ISO/IEC 27002:2013', 'legacy');
--
--    insert into public.citation_exemptions (question_group_id, token, reason)
--    values ('aecbc50f-9bb4-4131-a71b-046577d817c6', 'everything',
--            'a token that names a category rather than a citation must not be accepted here');

-- 7. NEGATIVE: nothing is granted to the browser roles. Expect 0 rows.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'citation_exemptions'
  and grantee in ('anon', 'authenticated');

-- 8. NEGATIVE: RLS is on. security_invoker-style storage trap does not apply
--    here, but relrowsecurity is a boolean and must read true.
select relname, relrowsecurity
from pg_class where oid = 'public.citation_exemptions'::regclass;
