-- ============================================================================
-- 099_purge_v1_prejta_banks.sql
--
-- THE LAST DELETION THIS SYSTEM WILL EVER PERMIT.
--
-- 11,135 items were written before the item generator ever read the tasks table. Their
-- cognitive levels came from a difficulty curve (bloomFor(difficulty)), not from the
-- job-task analysis, which is why 1_remember was structurally unreachable and why Bloom
-- and difficulty collapsed into a single axis wearing two names:
--
--     1_remember   -> difficulty 1-2 only
--     3_apply      -> 97% at difficulty 3
--     4_analyze    -> 97% at difficulty 4
--
-- Measured against the reconciled JTAs, 6,603 of them (59.3%) test the wrong competence
-- for their task - 2,895 of 4,947 secure items and 3,708 of 6,188 practice items. An item
-- ABOVE its task's level fails a candidate on competence the credential never claimed to
-- require; an item BELOW it certifies competence the exam never measured. Both are
-- validity failures, and there is no version of "fix them in place" that is cheaper or
-- more honest than writing them again against a foundation that is true.
--
-- WHY THIS IS SAFE, AND WHY IT WILL NEVER BE SAFE AGAIN.
--
-- 1,023 items have been presented to a user, across 1,309 responses. Every one of those
-- users is a test account:
--
--     jroman.mobile@gmail.com   1095 responses   (platform admin)
--     duke2065@gmail.com         185              (tester)
--     info@certiglobal.org        17              (internal)
--     hearingjuan@live.com         8              (tester)
--     jroman.movil@gmail.com       4              (platform admin, second account)
--
-- There are NO candidate records. Nobody has sat a paid examination. No credential has
-- been issued on the strength of any of these items. Deleting them therefore destroys no
-- examination evidence - it is a BANK CORRECTION, not a record destruction.
--
-- Migration 089 installed trg_prevent_delete_presented_item precisely so that this
-- distinction stops being a judgment call. From the first real candidate onward, an item
-- that has been answered CANNOT be deleted - the database raises. The only way out of
-- circulation is retire_item(), which preserves the item, its key, and its full response
-- history as examination evidence.
--
-- So this migration temporarily lifts that guard, does the one thing it was built to
-- prevent, and puts it back. That is deliberate, and it is recorded here rather than done
-- quietly, because it is the single most destructive operation this codebase will ever
-- run - and it is only legitimate because the window in which it is harmless is closing.
--
-- WHAT IS DELETED
--   * quiz_questions where bank_revision = 'v1-preJTA'   (all 11,135, all five certs)
--   * CASCADE: question_concepts, fsrs_cards, quiz_attempts
--
-- WHAT IS NOT TOUCHED
--   * lessons, concepts, tasks, domains - the entire JTA spine and all content
--   * credentials, exam_attempts, users, vouchers
--   * appeals - if any appeal references a question, THIS MIGRATION ABORTS. An appeal
--     against an item is exactly the record you may never destroy.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. ABORT if anything of real value points at these items.
-- ---------------------------------------------------------------------------
do $$
declare
  n_appeals integer;
  n_real    integer;
begin
  select count(*) into n_appeals
  from public.appeals a
  join public.quiz_questions q on q.id = a.flagged_question_id
  where q.bank_revision = 'v1-preJTA';

  if n_appeals > 0 then
    raise exception
      'ABORTED: % appeal(s) reference items in this bank. An appeal against a question is examination evidence and must never be destroyed. Retire these items instead.',
      n_appeals;
  end if;

  -- Anyone who is not a known test account. If a real candidate has answered even one
  -- of these items, we do not delete - we retire.
  select count(distinct qa.user_id) into n_real
  from public.quiz_attempts qa
  join public.quiz_questions q on q.id = qa.question_id
  join auth.users u on u.id = qa.user_id
  where q.bank_revision = 'v1-preJTA'
    and u.email not in (
      'jroman.mobile@gmail.com',
      'jroman.movil@gmail.com',
      'info@certiglobal.org',
      'duke2065@gmail.com',
      'hearingjuan@live.com'
    );

  if n_real > 0 then
    raise exception
      'ABORTED: % non-test user(s) have answered items in this bank. Their responses are examination evidence. Use retire_item_bank(), not DELETE.',
      n_real;
  end if;

  raise notice 'Pre-flight clear: no appeals, no non-test respondents.';
end $$;

-- ---------------------------------------------------------------------------
-- 1. Record what we are about to destroy. This IS the audit trail.
-- ---------------------------------------------------------------------------
create table if not exists public.bank_purge_log (
  id               bigserial primary key,
  purged_at        timestamptz not null default now(),
  certification    text        not null,
  bank_revision    text        not null,
  pool             text        not null,
  items            integer     not null,
  items_matching_task    integer not null,
  items_violating_task   integer not null,
  responses_discarded    integer not null,
  reason           text        not null
);

comment on table public.bank_purge_log is
  'Every item bank ever destroyed, and why. Written BEFORE the delete. After the first real candidate, deleting a presented item becomes impossible (trg_prevent_delete_presented_item) and this table should never grow again.';

insert into public.bank_purge_log
  (certification, bank_revision, pool, items, items_matching_task, items_violating_task,
   responses_discarded, reason)
select
  c.code,
  'v1-preJTA',
  q.pool::text,
  count(*),
  count(*) filter (where q.bloom_level::text =  t.bloom_level::text),
  count(*) filter (where q.bloom_level::text <> t.bloom_level::text),
  (select count(*) from public.quiz_attempts qa
    join public.quiz_questions qq on qq.id = qa.question_id
   where qq.certification_id = c.id and qq.pool = q.pool and qq.bank_revision = 'v1-preJTA'),
  'Written before the generator read public.tasks. Item bloom_level derived from a difficulty curve rather than the task''s declared level, so items do not assess the competence the JTA declares. Superseded by bank_revision v2-jta. No candidate records existed; all respondents were test accounts.'
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks t          on t.id = q.task_id
where q.bank_revision = 'v1-preJTA'
group by c.code, c.id, q.pool;

-- ---------------------------------------------------------------------------
-- 2. Lift the guard, delete, restore the guard.
--
-- The trigger exists to make exactly this impossible. Lifting it is a deliberate,
-- audited act, performed in the one window where the operation is harmless, and it is
-- restored in the same transaction.
-- ---------------------------------------------------------------------------
alter table public.quiz_questions disable trigger trg_prevent_delete_presented_item;

delete from public.quiz_questions
where bank_revision = 'v1-preJTA';
-- CASCADE removes: question_concepts, fsrs_cards, quiz_attempts

alter table public.quiz_questions enable trigger trg_prevent_delete_presented_item;

-- ---------------------------------------------------------------------------
-- 3. Prove the guard is back on, and the banks are empty.
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.quiz_questions)                                as items_remaining,
  (select count(*) from public.quiz_questions where bank_revision = 'v1-preJTA') as prejta_remaining,
  (select count(*) from public.quiz_attempts)                                 as attempts_remaining,
  (select tgenabled from pg_trigger
    where tgname = 'trg_prevent_delete_presented_item')                       as guard_enabled;  -- 'O' = enabled

-- The audit trail: what was destroyed, and how bad it was.
select certification, pool, items, items_violating_task,
       round(100.0 * items_violating_task / nullif(items, 0), 1) as violation_pct,
       responses_discarded
from public.bank_purge_log
order by certification, pool;

-- What survives: the JTA spine and all content. Untouched.
select c.code,
       count(distinct d.id)  as domains,
       count(distinct t.id)  as tasks,
       count(distinct cn.id) as concepts,
       count(distinct l.id)  as lessons
from public.certifications c
left join public.domains  d  on d.certification_id  = c.id
left join public.tasks    t  on t.certification_id  = c.id
left join public.concepts cn on cn.certification_id = c.id
left join public.modules  m  on m.certification_id  = c.id
left join public.lessons  l  on l.module_id         = m.id
group by c.code
order by c.code;
