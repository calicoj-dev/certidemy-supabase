-- 231_achievements.sql
-- Achievements become first class, and credentials stop assuming a certification.
--
-- WHY ONE TABLE AND NOT TWO
-- A second table for partner credentials would fork open-badge, the anchor
-- builder, the status lists, the badge baker, revoke/reinstate, verify-credential
-- and the certificate renderer. Every one of those already works. Nullable
-- columns on the existing table cost four DROP NOT NULLs; a parallel table costs
-- seven forked code paths that must then be kept in agreement forever.
--
-- NAMING DEBT, DELIBERATE
-- credentials.certification_name and certification_code are kept and stay
-- NOT NULL. They are now snapshots of the ACHIEVEMENT, which for every
-- Certidemy row is the same string it always was. They are not renamed because
-- both repos read them and a rename buys nothing but a grep. Read them as
-- "achievement_name" / "achievement_code" and leave the columns alone.
--
-- NOTE ON ORDERING: the achievement guard trigger is created in section 4b,
-- AFTER credentials.achievement_id exists. Creating it here would succeed and
-- then fail on the section 3 backfill, because a PL/pgSQL body is not parsed
-- until it runs.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 0. carried from 230
-- verification_domain was created as text in 230; companies.domain is citext and these
-- two get compared.
alter table public.issuers alter column verification_domain type citext;

-- ============================================================ 1. achievements

create table if not exists public.achievements (
  id                    uuid primary key default gen_random_uuid(),
  issuer_id             uuid not null references public.issuers(id) on delete restrict,

  -- code is the URL segment: /issuers/<slug>/achievements/<code>
  code                  text not null,

  -- OB3 controlled vocabulary. This is the rigor dial and the 17024 boundary:
  -- what a partner may select is enforced in the admin/API layer, not here.
  achievement_type      text not null default 'Certificate',

  -- NOT NULL only for Certidemy schemes. NULL for every partner achievement.
  certification_id      uuid references public.certifications(id) on delete restrict,

  name                  text not null,
  description           text not null,
  criteria_narrative    text,
  criteria_url          text,
  image_path            text,
  tags                  text[] not null default '{}',

  -- simple    : name, description, criteria, image
  -- structured: + alignments, results, skills, duration
  -- certification: the full JTA pipeline. Certidemy only.
  authoring_depth       text not null default 'simple',

  status                text not null default 'draft',
  default_validity_days integer,

  -- printed-ID generation for partners who do not supply their own
  display_id_prefix     text,
  display_id_seq        bigint not null default 0,

  created_by            uuid references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create unique index if not exists achievements_issuer_code_unique
  on public.achievements(issuer_id, code);

-- one achievement per certification, ever
create unique index if not exists achievements_certification_unique
  on public.achievements(certification_id) where certification_id is not null;

create index if not exists achievements_issuer_idx on public.achievements(issuer_id);

alter table public.achievements drop constraint if exists achievements_code_format;
alter table public.achievements add constraint achievements_code_format
  check (code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$');

alter table public.achievements drop constraint if exists achievements_type_vocab;
alter table public.achievements add constraint achievements_type_vocab
  check (achievement_type in (
    'Achievement','Assessment','Award','Badge','Certificate',
    'CertificateOfCompletion','Certification','Competency','Course',
    'Diploma','Fieldwork','LearningProgram','License','Membership',
    'MicroCredential'
  ) or achievement_type like 'ext:%');

alter table public.achievements drop constraint if exists achievements_depth_vocab;
alter table public.achievements add constraint achievements_depth_vocab
  check (authoring_depth in ('simple','structured','certification'));

alter table public.achievements drop constraint if exists achievements_status_vocab;
alter table public.achievements add constraint achievements_status_vocab
  check (status in ('draft','active','archived'));

-- ============================================================ 2. OB3 sub-objects
-- For Certidemy schemes alignments are DERIVED from the JTA at render time and
-- these tables stay empty. open-badge should emit the union of derived and
-- authored, which is not a fork: one side is empty on either path.

create table if not exists public.achievement_alignments (
  id                 uuid primary key default gen_random_uuid(),
  achievement_id     uuid not null references public.achievements(id) on delete cascade,
  target_name        text not null,
  target_url         text not null,
  target_framework   text,
  target_code        text,
  target_description text,
  target_type        text,
  order_index        smallint not null default 0,
  created_at         timestamptz not null default now()
);
create index if not exists achievement_alignments_ach_idx
  on public.achievement_alignments(achievement_id);

create table if not exists public.achievement_results (
  id             uuid primary key default gen_random_uuid(),
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  -- OB3 ResultType. Acreditta's "Tipo de resultado" dropdown is this vocabulary.
  result_type    text not null,
  required_value text,
  required_level text,
  value_min      text,
  value_max      text,
  allowed_values text[],
  order_index    smallint not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists achievement_results_ach_idx
  on public.achievement_results(achievement_id);

alter table public.achievement_results drop constraint if exists achievement_results_type_vocab;
alter table public.achievement_results add constraint achievement_results_type_vocab
  check (result_type in (
    'GradePointAverage','LetterGrade','Percent','PerformanceLevel',
    'PredictedScore','RawScore','Result','RubricCriterionLevel',
    'RubricScore','ScaledScore','Status'
  ) or result_type like 'ext:%');

-- ============================================================ 3. backfill
-- One achievement per existing certification, all on the certidemy issuer.

insert into public.achievements
  (issuer_id, code, achievement_type, certification_id, name, description,
   authoring_depth, status, created_at)
select
  (select id from public.issuers where slug = 'certidemy'),
  c.code,
  'Certification',
  c.id,
  c.name,
  coalesce(nullif(c.description, ''), c.name),
  'certification',
  'active',
  coalesce(c.created_at, now())
from public.certifications c
on conflict (certification_id) where certification_id is not null
do nothing;

-- ============================================================ 4. credentials

alter table public.credentials
  add column if not exists achievement_id uuid references public.achievements(id) on delete restrict,
  add column if not exists holder_email   citext,
  add column if not exists claimed_at     timestamptz,
  -- what PRINTS on the certificate. Free-form, partner-supplied or generated.
  -- credential_code stays the URL segment and keeps its entropy.
  add column if not exists display_id     text;

update public.credentials cr
set achievement_id = a.id
from public.achievements a
where a.certification_id = cr.certification_id
  and cr.achievement_id is null;

-- backfill holder_email so the OB3 identityHash has one uniform source
update public.credentials cr
set holder_email = u.email
from auth.users u
where u.id = cr.user_id and cr.holder_email is null;

-- every existing row already has an owner
update public.credentials
set claimed_at = coalesce(claimed_at, issued_at)
where user_id is not null and claimed_at is null;

alter table public.credentials alter column achievement_id set not null;

-- the four that assumed a certification
alter table public.credentials alter column certification_id drop not null;
alter table public.credentials alter column score_pct        drop not null;
alter table public.credentials alter column user_id          drop not null;

-- issue-to-email-then-claim: one of the two must exist
alter table public.credentials drop constraint if exists credentials_holder_present;
alter table public.credentials add constraint credentials_holder_present
  check (user_id is not null or holder_email is not null);

-- a score without an exam is a number nobody produced
alter table public.credentials drop constraint if exists credentials_score_requires_attempt;
alter table public.credentials add constraint credentials_score_requires_attempt
  check (score_pct is null or exam_attempt_id is not null or is_specimen);

create index if not exists credentials_achievement_idx on public.credentials(achievement_id);
create index if not exists credentials_holder_email_idx
  on public.credentials(holder_email) where user_id is null;

-- A credential's issuer must be the issuer of its achievement. Without this a
-- partner credential can name Certidemy as issuer and it will verify.
create or replace function public.guard_credential_issuer()
returns trigger language plpgsql as $$
declare
  v_issuer uuid;
begin
  select issuer_id into v_issuer from public.achievements where id = new.achievement_id;
  if v_issuer is null then
    raise exception 'achievement % not found', new.achievement_id;
  end if;
  if new.issuer_id is distinct from v_issuer then
    raise exception
      'credential issuer % does not match achievement issuer %',
      new.issuer_id, v_issuer;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_credential_issuer on public.credentials;
create trigger trg_guard_credential_issuer
  before insert or update of achievement_id, issuer_id on public.credentials
  for each row execute function public.guard_credential_issuer();

-- ============================================================ 4b. achievement guard
-- A Certidemy scheme cannot be attached to a partner issuer. Enforced by
-- trigger because a CHECK cannot reach another table.
create or replace function public.guard_achievement_identity()
returns trigger language plpgsql as $$
declare
  v_slug text;
begin
  if new.certification_id is not null then
    select slug into v_slug from public.issuers where id = new.issuer_id;
    if v_slug is distinct from 'certidemy' then
      raise exception
        'certification_id may only be attached to the certidemy issuer (got issuer %)',
        new.issuer_id;
    end if;
    if new.achievement_type <> 'Certification' then
      raise exception
        'an achievement backed by a certification must be achievement_type=Certification';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.code is distinct from old.code
     and exists (select 1 from public.credentials where achievement_id = old.id) then
    raise exception
      'achievement code is immutable once a credential exists (id=%, code=%)',
      old.id, old.code;
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_guard_achievement_identity on public.achievements;
create trigger trg_guard_achievement_identity
  before insert or update on public.achievements
  for each row execute function public.guard_achievement_identity();

-- ============================================================ 5. the claim path
-- Mirrors the voucher claim in 072. Called on signup and on email confirmation.
-- NOT a trigger on auth.users: 072 already owns a claim path and two triggers
-- racing over the same signup is worse than one explicit call.

create or replace function public.claim_credentials(p_user_id uuid, p_email citext)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.credentials
  set user_id = p_user_id, claimed_at = now()
  where user_id is null and holder_email = p_email;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.claim_credentials(uuid, citext) from public, anon, authenticated;

commit;

-- Verification (run separately, one at a time):
--
--   select count(*) as achievements,
--          count(*) filter (where certification_id is not null) as from_certs
--   from public.achievements;
--   -- expect 11 / 11
--
--   select count(*) as creds,
--          count(*) filter (where achievement_id is null) as unlinked,
--          count(*) filter (where holder_email is null)   as no_email
--   from public.credentials;
--   -- expect unlinked = 0, no_email = 0
--
--   select a.code, i.slug, count(c.id) as creds
--   from public.achievements a
--   join public.issuers i on i.id = a.issuer_id
--   left join public.credentials c on c.achievement_id = a.id
--   group by 1,2 order by 3 desc, 1;
--
-- Then prove the guards bite. BOTH must raise:
--
--   insert into public.achievements (issuer_id, code, achievement_type, name, description)
--   select id, 'GUARD-TEST', 'ext:nope', 'x', 'y' from public.issuers where slug='certidemy';
--   -- raises: achievements_type_vocab? No - ext: is allowed. This one INSERTS.
--   -- delete it: delete from public.achievements where code = 'GUARD-TEST';
--
--   update public.achievements set code = 'ZZZ' where code = 'SM-AI-I';
--   -- MUST raise P0001 (a credential exists against it)
