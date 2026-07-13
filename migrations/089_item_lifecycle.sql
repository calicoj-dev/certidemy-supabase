-- ============================================================================
-- 089_item_lifecycle.sql
--
-- ITEM LIFECYCLE: retire, never delete.
--
-- WHY THIS EXISTS, AND WHY NOW.
--
-- We are about to purge and regenerate ~4,500 secure items, because they were
-- written without the job-task analysis in scope and carry Bloom levels derived from
-- a difficulty curve rather than from their tasks. Pre-launch, that purge is free:
-- no candidate has sat an exam, so no item has a response history to destroy.
--
-- After launch, the same operation would be a catastrophe. Deleting an item that a
-- candidate has answered:
--   * destroys the psychometric record for that item (p-value, point-biserial,
--     distractor analysis) - the raw material of the standard-setting study and of
--     every reliability statistic 17024 will ask us to produce;
--   * orphans quiz_attempts.question_id, silently corrupting every historical
--     attempt that touched it;
--   * makes it impossible to reconstruct WHICH form a past candidate actually sat -
--     which is the evidence you need when a credential is challenged.
--
-- ISO/IEC 17024 requires records of the examination sufficient to demonstrate that
-- each certification decision was sound. An item bank you can silently rewrite is not
-- an examination record. It is a moving target.
--
-- THE RULE, from this migration forward:
--
--   Once an item has been PRESENTED TO A CANDIDATE, it is never deleted.
--   It is RETIRED. Its text, its key, and its response history are preserved.
--
-- Retiring removes an item from circulation for future forms. It does not remove it
-- from history. A retired item still carries its attempts, still contributes to the
-- statistics of the candidates who saw it, and can still be produced for an auditor
-- or a challenge years later.
--
-- Deletion remains available for items that have NEVER been seen - a bad generation
-- run, a purge of a pre-launch bank. That is a bank correction, not a record
-- destruction. The trigger below draws exactly that line, and enforces it in the
-- database rather than in a convention someone will eventually forget.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Lifecycle columns
-- ---------------------------------------------------------------------------

-- The status enum already carries 'approved'. Add the terminal states.
-- (Text column with a check constraint rather than an enum: cheaper to extend, and
-- we do not want a migration lock every time the lifecycle grows a state.)
alter table public.quiz_questions
  add column if not exists retired_at    timestamptz,
  add column if not exists retired_by    uuid references auth.users(id),
  add column if not exists retire_reason text,
  -- The generation that produced this item. Bumped whenever the bank is rebuilt for
  -- a substantive reason (JTA revision, cognitive-model change, item-writing fix).
  -- Lets us say "these items were written under cognitive model v2.0" and prove it.
  add column if not exists bank_revision text not null default 'v1-preJTA',
  -- The item this one replaces, if it was written to supersede a retired item.
  -- Gives a clean lineage: retired item -> its replacement -> the next.
  add column if not exists supersedes_id uuid references public.quiz_questions(id);

comment on column public.quiz_questions.retired_at is
  'Set when the item leaves circulation. A retired item is NEVER deleted: its response history is examination evidence.';
comment on column public.quiz_questions.bank_revision is
  'The item-bank generation that produced this item. v1-preJTA = written before the JTA was wired into the generator (bloom derived from a difficulty curve). v2-jta = written against its task statement, KSAs and declared bloom level.';
comment on column public.quiz_questions.supersedes_id is
  'The retired item this one replaces. Preserves lineage across bank revisions.';

create index if not exists quiz_questions_live_idx
  on public.quiz_questions (certification_id, pool, language, task_id)
  where retired_at is null;

-- ---------------------------------------------------------------------------
-- 2. Has this item ever been seen by a candidate?
-- ---------------------------------------------------------------------------
create or replace function public.item_has_been_presented(p_question_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.quiz_attempts qa where qa.question_id = p_question_id
  );
$$;

comment on function public.item_has_been_presented(uuid) is
  'True once any candidate has been shown this item. The line between "bank correction" (deletable) and "examination record" (retire only).';

-- ---------------------------------------------------------------------------
-- 3. The guard. Enforced in the DB, not in a convention.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_delete_presented_item()
returns trigger
language plpgsql
as $$
begin
  if public.item_has_been_presented(old.id) then
    raise exception using
      errcode = 'restrict_violation',
      message = format(
        'Item %s has been presented to candidates and cannot be deleted.',
        old.id
      ),
      detail  = 'Its response history is examination evidence: it underpins the item statistics, the cut-score study, and any future challenge to a credential awarded on a form that contained it.',
      hint    = 'Retire it instead: select public.retire_item(''' || old.id || ''', ''reason''). Retiring removes it from future forms and preserves the record.';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_prevent_delete_presented_item on public.quiz_questions;
create trigger trg_prevent_delete_presented_item
  before delete on public.quiz_questions
  for each row execute function public.prevent_delete_presented_item();

-- ---------------------------------------------------------------------------
-- 4. Retire an item (the supported path out of circulation)
-- ---------------------------------------------------------------------------
create or replace function public.retire_item(
  p_question_id uuid,
  p_reason      text,
  p_retired_by  uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'A retirement reason is required. It is part of the examination record.';
  end if;

  update public.quiz_questions
  set retired_at    = coalesce(retired_at, now()),
      retired_by    = coalesce(p_retired_by, retired_by),
      retire_reason = p_reason,
      status        = 'retired'
  where id = p_question_id;

  if not found then
    raise exception 'No such item: %', p_question_id;
  end if;
end;
$$;

comment on function public.retire_item(uuid, text, uuid) is
  'Remove an item from circulation while preserving it, its key, and its full response history. The only supported way to take a live item out of service.';

-- ---------------------------------------------------------------------------
-- 5. Bulk retire: a whole cert/pool, e.g. when a bank revision supersedes it
-- ---------------------------------------------------------------------------
create or replace function public.retire_item_bank(
  p_certification_id uuid,
  p_pool             text,
  p_reason           text,
  p_retired_by       uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'A retirement reason is required.';
  end if;

  update public.quiz_questions
  set retired_at    = coalesce(retired_at, now()),
      retired_by    = coalesce(p_retired_by, retired_by),
      retire_reason = p_reason,
      status        = 'retired'
  where certification_id = p_certification_id
    and pool = p_pool
    and retired_at is null;

  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. The live bank. Everything that assembles a form reads THIS, not the table.
-- ---------------------------------------------------------------------------
create or replace view public.v_live_items as
select *
from public.quiz_questions
where retired_at is null
  and status = 'approved';

comment on view public.v_live_items is
  'Items eligible for a form. Retired items are examination evidence, not candidates for circulation.';

-- ---------------------------------------------------------------------------
-- 7. Evidence view: what happened to each retired item, and how it did
-- ---------------------------------------------------------------------------
create or replace view public.v_retired_items_evidence as
select
  q.id,
  c.code            as certification,
  q.pool,
  q.language,
  q.task_id,
  q.bloom_level,
  q.difficulty,
  q.bank_revision,
  q.retired_at,
  q.retire_reason,
  q.supersedes_id,
  count(qa.id)                                        as times_presented,
  count(qa.id) filter (where qa.is_correct)           as times_correct,
  round(
    100.0 * count(qa.id) filter (where qa.is_correct)
    / nullif(count(qa.id), 0), 1
  )                                                   as p_value_pct,
  round(avg(qa.time_taken_seconds), 1)                as avg_seconds
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
left join public.quiz_attempts qa on qa.question_id = q.id
where q.retired_at is not null
group by q.id, c.code;

comment on view public.v_retired_items_evidence is
  'Every retired item with the statistics it earned while live. This is what an auditor asks for when a credential is challenged: what was on the form, and how did candidates perform on it.';

-- ---------------------------------------------------------------------------
-- 8. Grants
-- ---------------------------------------------------------------------------
-- RLS is not a grant. The table-level grant must ship WITH the feature that needs it.
grant select on public.v_live_items             to authenticated, service_role;
grant select on public.v_retired_items_evidence to service_role;
grant execute on function public.retire_item(uuid, text, uuid)            to service_role;
grant execute on function public.retire_item_bank(uuid, text, text, uuid) to service_role;
grant execute on function public.item_has_been_presented(uuid)            to authenticated, service_role;

-- NOTE: correct_answer stays column-revoked from client roles on the base table.
-- v_live_items inherits nothing automatically - the exam scorer reads it through
-- getServiceClient(). Do not grant this view to anon.

-- ---------------------------------------------------------------------------
-- 9. Mark the existing bank for what it is
-- ---------------------------------------------------------------------------
-- Every item currently in the bank was written before the JTA reached the generator:
-- item bloom_level was stamped from a difficulty curve, and the draft prompt never saw
-- the task statement, its KSAs, or its declared cognitive level. Label them honestly
-- so that after regeneration we can prove which items were written under which model.
update public.quiz_questions
set bank_revision = 'v1-preJTA'
where bank_revision is null or bank_revision = '';

-- ---------------------------------------------------------------------------
-- 10. Proof
-- ---------------------------------------------------------------------------
do $$
declare
  presented integer;
begin
  select count(*) into presented
  from public.quiz_questions q
  where public.item_has_been_presented(q.id);

  raise notice '--------------------------------------------------------------';
  raise notice 'ITEM LIFECYCLE INSTALLED';
  raise notice '  items ever presented to a candidate : %', presented;
  if presented = 0 then
    raise notice '  -> pre-launch. The pending purge destroys NO examination record.';
    raise notice '     After launch this trigger makes that impossible, permanently.';
  else
    raise notice '  -> % item(s) now carry examination evidence and CANNOT be deleted.', presented;
  end if;
  raise notice '--------------------------------------------------------------';
end $$;
