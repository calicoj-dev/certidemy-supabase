-- 240_credential_results.sql
--
-- Per-holder results. The difference between a badge and a transcript.
--
-- ============================ TWO OBJECTS, NOT ONE =======================
--
-- These are constantly confused and the confusion produces the wrong schema:
--
--   achievement_results   the SHAPE of a result. "There will be a Percent;
--                         passing is 70." Same for every holder. Already
--                         exists, migration 231. OB 3.0 ResultDescription.
--
--   credential_results    what THIS holder actually got. "87." Per person.
--                         This migration. OB 3.0 Result, which lives on
--                         credentialSubject, not on the Achievement.
--
-- A professor recording a grade is writing the second. Putting it anywhere
-- near the first would make one student's mark part of the course definition
-- every other student's credential points at.
--
-- ============================ THE PRIVACY DECISION =======================
--
-- A credential document is fetchable by anyone holding its URL. "Cum laude" on
-- a diploma is meant to be read by strangers. "62 on the midterm" is not, and
-- publishing it would be a data-protection problem in every jurisdiction this
-- platform sells into.
--
-- So visibility is PER CREDENTIAL and defaults to holder-only. open-badge
-- already builds two documents -- one with the salted identifier for the
-- holder, one without for everybody else -- and results follow the same split
-- by the same mechanism. The issuer opts a credential into public results
-- deliberately; nothing becomes public by forgetting.
--
-- NOTE: 'public' means public. Unguessable URL is not access control -- it is
-- one forwarded email away from being a link on a noticeboard.
--
-- ============================ MATERIAL CHANGE ============================
--
-- Results are inside the signed document. Adding, changing or removing one is
-- a material change and MUST bump credentials.material_updated_at, or the
-- proof's `created` stops describing the document it covers.
--
-- Grades usually arrive AFTER the badge, so this is not an edge case, it is
-- the normal path. Hence a trigger rather than a note: this project's recurring
-- defect is rules that live in prose and depend on somebody remembering them at
-- the right moment.
--
-- A bump means the anchor leaf no longer matches and that credential needs
-- re-anchoring. Correct, and the cost of recording a grade after the fact.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. visibility
alter table public.credentials
  add column if not exists results_visibility text not null default 'holder';

alter table public.credentials drop constraint if exists credentials_results_visibility_vocab;
alter table public.credentials add constraint credentials_results_visibility_vocab
  check (results_visibility in ('holder', 'public'));

comment on column public.credentials.results_visibility is
  'Who sees credential_results in the served document. "holder" (default) puts them only in the authenticated holder copy, alongside the salted identifier. "public" puts them in the document any link-holder can fetch -- appropriate for honours on a diploma, not for a midterm mark.';

-- ============================================================ 2. results
create table if not exists public.credential_results (
  id                    uuid primary key default gen_random_uuid(),
  credential_id         uuid not null references public.credentials(id) on delete cascade,

  -- The declared ResultDescription this answers, when there is one. NULL is
  -- valid: OB 3.0 permits a Result with no description, which is what an
  -- ad-hoc line on a transcript is.
  achievement_result_id uuid references public.achievement_results(id) on delete set null,

  -- Denormalised from the description, or supplied directly. Present even when
  -- achievement_result_id is set, because a description can be edited and this
  -- row must keep saying what it said when it was signed.
  result_type           text not null,

  /* The value. TEXT, deliberately.

     A grade is "87", "B+", "Aprobado", "Distinction", "7/10" -- and in Brazil
     "8,5". Coercing that to numeric would either reject half of it or silently
     reinterpret a comma. The OB 3.0 Result carries a string; so does this. */
  value                 text,

  -- Rubric level, when the result is a level rather than a value.
  achieved_level        text,

  -- OB 3.0 ResultStatusType.
  status                text,

  /* Free label. A transcript line is "Midterm", "Final project", "Thesis
     defence" -- none of which OB 3.0 names, because it did not set out to be a
     transcript. Emitted as a certidemy: extension, which a consumer that does
     not know it ignores. */
  label                 text,

  order_index           smallint not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists credential_results_credential_idx
  on public.credential_results(credential_id, order_index);

alter table public.credential_results drop constraint if exists credential_results_type_vocab;
alter table public.credential_results add constraint credential_results_type_vocab
  check (result_type in (
    'GradePointAverage','LetterGrade','Percent','PerformanceLevel',
    'PredictedScore','RawScore','Result','RubricCriterionLevel',
    'RubricScore','ScaledScore','Status'
  ) or result_type like 'ext:%');

alter table public.credential_results drop constraint if exists credential_results_status_vocab;
alter table public.credential_results add constraint credential_results_status_vocab
  check (status is null or status in (
    'Completed','Enrolled','Failed','InProgress','OnHold','Provisional','Withdrew'
  ));

-- A result that says nothing is a row that will render as an empty line on
-- somebody's transcript.
alter table public.credential_results drop constraint if exists credential_results_says_something;
alter table public.credential_results add constraint credential_results_says_something
  check (
    coalesce(nullif(btrim(value), ''), '') <> ''
    or coalesce(nullif(btrim(achieved_level), ''), '') <> ''
    or status is not null
  );

-- ============================================================ 3. the bump
-- Results are inside the signed document. Changing one changes the bytes.
create or replace function public.credential_results_bump_material()
returns trigger
language plpgsql
as $function$
declare
  v_credential uuid;
begin
  v_credential := coalesce(new.credential_id, old.credential_id);

  -- Not credentials_bump_material: that one watches holder_name on the
  -- credential row itself. This is a change to a CHILD table that the
  -- credential's serialised form includes, which no trigger on credentials
  -- could ever see.
  update public.credentials
  set material_updated_at = now()
  where id = v_credential;

  return coalesce(new, old);
end;
$function$;

drop trigger if exists trg_credential_results_bump on public.credential_results;
create trigger trg_credential_results_bump
  after insert or update or delete on public.credential_results
  for each row execute function public.credential_results_bump_material();

-- ============================================================ 4. guards
-- A result may only reference a ResultDescription belonging to the SAME
-- achievement the credential was issued against. Without this, a transcript
-- line can point at another course's rubric and the document will happily say
-- so.
create or replace function public.guard_credential_result_description()
returns trigger
language plpgsql
as $function$
declare
  v_cred_achievement uuid;
  v_desc_achievement uuid;
begin
  if new.achievement_result_id is null then
    new.updated_at := now();
    return new;
  end if;

  select achievement_id into v_cred_achievement
  from public.credentials where id = new.credential_id;

  select achievement_id into v_desc_achievement
  from public.achievement_results where id = new.achievement_result_id;

  if v_cred_achievement is distinct from v_desc_achievement then
    raise exception
      'result description % belongs to a different achievement than credential %',
      new.achievement_result_id, new.credential_id;
  end if;

  new.updated_at := now();
  return new;
end $function$;

drop trigger if exists trg_guard_credential_result_description on public.credential_results;
create trigger trg_guard_credential_result_description
  before insert or update on public.credential_results
  for each row execute function public.guard_credential_result_description();

-- ============================================================ 5. reads
-- Same shape as 239. Service role writes; the console and the holder read.
alter table public.credential_results enable row level security;

grant select on public.credential_results to authenticated;

-- The holder sees their own. An issuer sees results on credentials they
-- issued. Nobody else reaches this table -- the PUBLIC document is assembled
-- by open-badge under service_role, which is where the visibility flag is
-- applied.
drop policy if exists credential_results_read on public.credential_results;
create policy credential_results_read on public.credential_results
  for select to authenticated
  using (
    exists (
      select 1 from public.credentials c
      where c.id = credential_id
        and (
          c.user_id = auth.uid()
          or public.can_read_issuer(c.issuer_id)
        )
    )
  );

commit;

-- Verification (run separately, one at a time):
--
--   select column_name, data_type, is_nullable from information_schema.columns
--   where table_schema='public' and table_name='credential_results'
--   order by ordinal_position;
--
--   select results_visibility, count(*) from public.credentials
--   group by 1;
--   -- every existing row 'holder'. Nothing became public by being upgraded.
--
-- Prove the bump. Note the timestamp, insert a result, note it again:
--
--   select material_updated_at from public.credentials
--   where credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P';
--
--   insert into public.credential_results
--     (credential_id, result_type, value, label, status, order_index)
--   select id, 'Percent', '92', 'Final assessment', 'Completed', 0
--   from public.credentials where credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P'
--   returning id;
--
--   select material_updated_at from public.credentials
--   where credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P';
--   -- MUST have moved. If it has not, the trigger did not attach and every
--   -- grade recorded from here on would be signed under a stale timestamp.
--
-- Prove the cross-achievement guard. This MUST raise:
--
--   insert into public.credential_results
--     (credential_id, achievement_result_id, result_type, value)
--   select c.id, r.id, 'Percent', '50'
--   from public.credentials c, public.achievement_results r
--   where c.credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P'
--     and r.achievement_id <> c.achievement_id
--   limit 1;
--   -- (no rows to join today: there are no achievement_results yet, so this
--   --  returns 0 rows rather than raising. Re-run it once one exists.)
