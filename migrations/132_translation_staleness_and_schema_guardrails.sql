-- 132_translation_staleness_and_schema_guardrails.sql
--
-- PREVENTION, not repair. Two mechanisms that make classes of defect found on
-- 2026-07-23 impossible to repeat on a future certification.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-clean. Idempotent (create or replace / drop if exists).
--
-- ===========================================================================
-- PART 1 - TRANSLATION STALENESS BECOMES SELF-DECLARING
-- ===========================================================================
-- THE FAILURE THIS PREVENTS
--
-- Migration 091 rewrote five SM-AI-I task statements to fix Bloom alignment.
-- Their es-419 and pt-BR translations had already been loaded and approved, and
-- NOTHING marked them stale. Weeks later a translator working from the (also
-- stale) JTA markdown produced five more translations of superseded English, and
-- the defect was found only because a human read a CSV column by column.
--
-- The published Spanish blueprint said "Explicar los tres pilares" while the exam
-- measured "Apply the three pillars to diagnose which pillar is broken". A
-- Spanish-speaking candidate was shown a different competence than the one being
-- assessed. That is a construct-validity failure under ISO/IEC 17024, and it
-- survived because staleness had no signal.
--
-- WHY A TRIGGER RATHER THAN A PROCEDURE
--
-- CERT-CREATION.md places translation at Stage 11 and describes it as
-- "progressive, not a launch blocker". JTA translations are not in the playbook
-- at all. Adding a written step saying "remember to re-approve translations
-- after changing a statement" would depend on someone remembering, months later,
-- while doing something else. A trigger does not forget.
--
-- After this, changing an English statement ALWAYS flips its translations back to
-- provisional, in the same transaction, with no way to bypass it short of
-- disabling the trigger.

create or replace function public.fn_invalidate_task_translations()
returns trigger
language plpgsql
as $$
begin
  -- Only the statement is translated (task_translations has no knowledge/skills/
  -- abilities columns), so K/S/A edits do not invalidate anything.
  if new.statement is distinct from old.statement then
    update public.task_translations
       set is_provisional = true
     where task_id = new.id
       and not is_provisional;
  end if;
  return new;
end;
$$;

comment on function public.fn_invalidate_task_translations() is
  'Flips a task''s translations back to provisional whenever its English statement changes. Translation staleness caused a real construct-validity defect in SM-AI-I (migration 091 vs the loaded translations); this makes it self-declaring rather than dependent on anyone remembering.';

drop trigger if exists trg_invalidate_task_translations on public.tasks;
create trigger trg_invalidate_task_translations
  after update of statement on public.tasks
  for each row
  execute function public.fn_invalidate_task_translations();


-- Domains carry a translated title AND description; either changing invalidates.
create or replace function public.fn_invalidate_domain_translations()
returns trigger
language plpgsql
as $$
begin
  if new.title is distinct from old.title
     or new.description is distinct from old.description then
    update public.domain_translations
       set is_provisional = true
     where domain_id = new.id
       and not is_provisional;
  end if;
  return new;
end;
$$;

comment on function public.fn_invalidate_domain_translations() is
  'Domain counterpart of fn_invalidate_task_translations. Both title and description are translated, so either changing invalidates.';

drop trigger if exists trg_invalidate_domain_translations on public.domains;
create trigger trg_invalidate_domain_translations
  after update of title, description on public.domains
  for each row
  execute function public.fn_invalidate_domain_translations();


-- ===========================================================================
-- PART 2 - SCHEMA-LEVEL GUARDRAILS THE VERIFIER CAN SEE
-- ===========================================================================
-- verify-cert.mjs checks the DATABASE CONTENT against itself. It cannot see
-- schema PROPERTIES - grants, foreign-key delete rules, view security settings -
-- because supabase-js cannot reach information_schema directly. Two real defects
-- lived in exactly that blind spot:
--
--   1. v_live_items emitted correct_answer and was granted to 'authenticated'
--      with no security_invoker, so it ran as its owner past RLS. Any signed-in
--      user could have read the secure exam answer key through PostgREST. The
--      base table was hardened correctly; the view bypassed it. (migration 126)
--
--   2. quiz_attempts.question_id was ON DELETE CASCADE, so deleting an item
--      silently destroyed the record that a candidate had been presented it and
--      answered it - the audit evidence behind a scored decision. (migration 127)
--
-- Both were found by reading the schema by hand. This view surfaces them so the
-- gate can fail on them instead.

create or replace view public.v_schema_guardrails as
select
  -- (1) THE ANSWER-KEY FIREWALL, AT THE VIEW LAYER.
  -- Counts views that EMIT a correct_answer column and are readable by a client
  -- role. Deliberately checks emitted COLUMNS, not the view definition text: a
  -- text match on 'correct_answer' produces false positives for views that only
  -- aggregate it (v_question_group_integrity does count(distinct correct_answer)
  -- and emits an integer, which is safe).
  (
    select count(*)::int
      from information_schema.columns col
     where col.table_schema = 'public'
       and col.column_name = 'correct_answer'
       and exists (select 1 from pg_views v
                    where v.schemaname = 'public' and v.viewname = col.table_name)
       and exists (select 1 from information_schema.role_table_grants g
                    where g.table_schema = 'public'
                      and g.table_name = col.table_name
                      and g.grantee in ('anon','authenticated'))
  ) as answer_key_views_exposed,

  -- (2) ATTEMPT EVIDENCE MUST SURVIVE ITEM DELETION.
  -- quiz_attempts.question_id must never be CASCADE. Items are RETIRED, never
  -- deleted, once answered.
  (
    select count(*)::int
      from information_schema.referential_constraints rc
      join information_schema.table_constraints tc
        on tc.constraint_name = rc.constraint_name
       and tc.constraint_schema = rc.constraint_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name
       and ccu.table_schema = tc.table_schema
     where tc.table_schema = 'public'
       and tc.table_name = 'quiz_attempts'
       and ccu.table_name = 'quiz_questions'
       and rc.delete_rule <> 'RESTRICT'
  ) as attempt_evidence_cascades,

  -- (3) HYGIENE: views granted to a client role that run as their OWNER.
  -- An owner-run view bypasses RLS on its base tables (quiz_questions has
  -- relforcerowsecurity = false, so RLS does not apply to the owner). Not always
  -- wrong - v_cert_lesson_totals emits only aggregate counts and is fine - so
  -- this is reported for review rather than treated as a failure.
  (
    select count(*)::int
      from pg_views v
      join pg_class c on c.relname = v.viewname
      join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
     where v.schemaname = 'public'
       and (c.reloptions is null
            or not exists (select 1 from unnest(c.reloptions) o
                            where o like 'security_invoker=%'))
       and exists (select 1 from information_schema.role_table_grants g
                    where g.table_schema = 'public'
                      and g.table_name = v.viewname
                      and g.grantee in ('anon','authenticated'))
  ) as owner_run_views_granted;

comment on view public.v_schema_guardrails is
  'Schema properties the content verifier cannot otherwise reach: answer-key exposure through views, attempt-evidence survival, and owner-run views granted to client roles. Read by verify-cert.mjs.';

grant select on public.v_schema_guardrails to service_role;


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) the guardrails read clean. Expect 0 / 0 / and a small reviewable number.
-- select * from public.v_schema_guardrails;
--
-- (b) the trigger works. This changes a statement, checks the translations went
--     provisional, then puts everything back. Run the whole block at once.
--
-- begin;
--   select count(*) filter (where is_provisional) as before_provisional
--     from public.task_translations tt
--     join public.tasks t on t.id = tt.task_id
--    where t.certification_id = (select id from public.certifications where code='AIE-I')
--      and t.code = '1.1';
--
--   update public.tasks set statement = statement || ' TEMP'
--    where certification_id = (select id from public.certifications where code='AIE-I')
--      and code = '1.1';
--
--   select count(*) filter (where is_provisional) as after_provisional   -- expect 2
--     from public.task_translations tt
--     join public.tasks t on t.id = tt.task_id
--    where t.certification_id = (select id from public.certifications where code='AIE-I')
--      and t.code = '1.1';
-- rollback;
--
-- (c) confirm the rollback left nothing behind. Expect 0.
-- select count(*) from public.task_translations tt
--   join public.tasks t on t.id = tt.task_id
--  where t.certification_id = (select id from public.certifications where code='AIE-I')
--    and tt.is_provisional;
-- ---------------------------------------------------------------------------
