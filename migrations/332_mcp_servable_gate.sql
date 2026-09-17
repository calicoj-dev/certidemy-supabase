-- 332_mcp_servable_gate.sql
--
-- THE ADDRESS-NOT-TEXT RULE, ENFORCED IN THE SCHEMA.
--
-- IP-POSITION section 6: "An MCP returns Certidemy's prose and clause ADDRESSES.
-- It never returns clause TEXT." Section 7 item 3: "If an MCP is built, the
-- address-not-text rule is enforced in code, not in a prompt."
--
-- This is that enforcement, and it is deliberately NOT an `if` in an edge
-- function. The argument is the one 315/316 already made for the paywall: the
-- grant decides, not application code. A lesson whose body may not be
-- redistributed is not in `mcp.lesson` at all, so no function, no refactor and
-- no new caller can serve it by forgetting a check.
--
-- ===================== WHAT THE COLUMNS MEAN =====================
--
--   mcp_iso_longest_run  the longest contiguous run of words this lesson shares
--                        with ISO 19011:2026, ISO/IEC 27001:2022 or
--                        ISO/IEC 42001:2023. NULL means NEVER SCANNED, which is
--                        not the same as zero and must never be read as safe.
--   mcp_scan_sources     which standard editions that number was measured
--                        against. A scan against a source set that has since
--                        changed is visible rather than silently trusted.
--   mcp_scanned_at       when.
--   mcp_servable         the derived gate. Written by the scanner, never by hand.
--
-- THE EVIDENCE AND THE VERDICT ARE STORED SEPARATELY ON PURPOSE. The threshold
-- is a policy decision and policy decisions change; the measurement does not.
-- Storing the run length means the policy can move with one UPDATE over
-- `mcp_leak_policy` and a re-derivation, instead of re-reading three PDFs
-- against 2,000 lessons to answer a question already measured.
--
-- ===================== THE THRESHOLD, AND WHY THIS ONE =====================
--
-- IP-POSITION section 2 already establishes that the curve has NO ELBOW -- run
-- counts decay smoothly at about x0.75 per added word, so no threshold is
-- justifiable from the distribution. It settled on 20 words, chosen by reading
-- runs at each length and finding where they stop being terminology and start
-- being sentences.
--
-- THIS SHIPS AT 10, WHICH IS STRICTER, and the reason is a control rather than a
-- curve. AISM-I cites no ISO standard at all -- 183 lessons across three
-- languages, measured, longest shared run EIGHT words ("when they are
-- interacting with an ai system"). A corpus known to be independent produces
-- nothing at 10. So 10 is the length at which a match stops being explicable by
-- the shared vocabulary of the field, calibrated on a corpus that is NOT under
-- judgement.
--
-- That distinction is the whole point. A threshold tuned until the accused pass
-- is not a position. This one is tuned on the acquitted, it is stricter than the
-- documented figure, and IT RESCUES NOBODY: at 10, ISMS-IA still fails 31 of 38
-- lessons and AIMS-IA 39 of 40.
--
-- ===================== NO PRODUCTION IMPACT, MEASURED =====================
--
-- All 951 currently-served lesson rows -- the eight certifications in the mcp
-- views, all three languages -- were scanned against the three standards before
-- this was written. ZERO carry a run of 10 words or more. The longest anywhere
-- in the served corpus is the eight-word AISM-I phrase above.
--
-- So the gate closes on nothing that is open today. It exists for ISMS-F,
-- ISMS-IA, AIMS-F and AIMS-IA, none of which is in the views.
--
-- ===================== EVERY WRITER OF public.lessons =====================
--
-- CLAUDE.md requires this list before a column with a NOT NULL constraint lands,
-- because "adding a column to a table does not fail the writers that predate it
-- until one of them runs".
--
--   scripts/load-lessons-direct.mjs:176   INSERT. New lessons take the default
--                                         FALSE and are unservable until scanned.
--                                         That is the intended direction.
--   scripts/update-lesson-content.mjs:123 UPDATE content_md -> trigger clears.
--   scripts/apply-marking-spec.mjs:231    UPDATE content_md -> trigger clears.
--   scripts/scrum-terminology-pass.mjs:215,253  UPDATE content_md -> trigger clears.
--
-- scripts/wire-lessons.mjs reads only. The web repo writes `lessons` NOWHERE:
-- its ingest pipeline has no lessons table config and diff-lessons.ts states in
-- its own header that it writes nothing. Checked in both repos.
--
-- AND NOTE WHAT THAT LIST IS FOR. Not one of those four writers has to learn
-- about this column. The trigger does not depend on any writer remembering, and
-- that is the only reason this is safe -- a convention that every content script
-- must clear a flag is a convention that lasts until the next script.
--
-- ===================== THE FAIL DIRECTION =====================
--
-- DEFAULT FALSE. A lesson nobody has scanned is not servable. The alternative
-- fails open, and the failure mode of failing open here is redistributing
-- paywalled standard text to a machine on request -- which is the single thing
-- this whole mechanism exists to prevent.
--
-- 333 changes the views. This migration does NOT, so that the scanner can
-- populate the columns first and the served surface never goes dark.

begin;

-- ------------------------------------------------------------ 1. the policy

create table if not exists public.mcp_leak_policy (
  id              boolean primary key default true,
  threshold_words integer not null,
  standards       text[]  not null,
  rationale       text    not null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users(id) on delete set null,
  constraint mcp_leak_policy_single_row check (id),
  constraint mcp_leak_policy_threshold_sane check (threshold_words between 5 and 100)
);

comment on table public.mcp_leak_policy is
  'One row. The run length at which shared wording counts as reproduced clause text, and what it is measured against.';
comment on column public.mcp_leak_policy.threshold_words is
  'Calibrated on AISM-I, which cites no ISO standard and peaks at 8 words. Not chosen from the corpus under judgement.';

insert into public.mcp_leak_policy (id, threshold_words, standards, rationale)
values (true, 10,
        array['ISO 19011:2026', 'ISO/IEC 27001:2022', 'ISO/IEC 42001:2023'],
        'AISM-I cites no ISO standard and its longest shared run is 8 words across 183 lessons; 10 is the first length a known-independent corpus cannot reach.')
on conflict (id) do nothing;

-- ------------------------------------------------------------ 2. the columns

alter table public.lessons
  add column if not exists mcp_iso_longest_run integer,
  add column if not exists mcp_scan_sources    text,
  add column if not exists mcp_scanned_at      timestamptz,
  add column if not exists mcp_servable        boolean not null default false;

comment on column public.lessons.mcp_iso_longest_run is
  'Longest contiguous word run shared with an indexed ISO standard. NULL means NEVER SCANNED, which is not zero.';
comment on column public.lessons.mcp_servable is
  'May this body be returned by the MCP. Written by the scanner only. Cleared automatically whenever content_md changes.';
comment on column public.lessons.mcp_scan_sources is
  'The standard editions the run length was measured against, so a scan predating a source change is visible.';

alter table public.lessons
  drop constraint if exists lessons_mcp_scan_coherent;
alter table public.lessons
  add constraint lessons_mcp_scan_coherent
  check (
    -- Servable requires evidence. This is the constraint that makes "NULL is not
    -- zero" enforceable rather than merely documented.
    (mcp_servable = false)
    or (mcp_iso_longest_run is not null and mcp_scanned_at is not null and mcp_scan_sources is not null)
  );

-- ------------------------------------------------------------ 3. the trigger

create or replace function public.clear_mcp_servable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  -- The body changed, so every fact measured about the old body is now a claim
  -- about text that no longer exists. A stale TRUE here would serve unreviewed
  -- content under a scan that passed on something else.
  if new.content_md is distinct from old.content_md then
    new.mcp_servable        := false;
    new.mcp_iso_longest_run := null;
    new.mcp_scanned_at      := null;
    new.mcp_scan_sources    := null;
  end if;
  return new;
end
$fn$;

comment on function public.clear_mcp_servable() is
  'An edited lesson leaves the served set until rescanned. The flag is a fact about the CURRENT bytes, never a memory of a past review.';

drop trigger if exists trg_lessons_clear_mcp_servable on public.lessons;
create trigger trg_lessons_clear_mcp_servable
  before update on public.lessons
  for each row
  execute function public.clear_mcp_servable();

-- ------------------------------------------------------------ 4. the grants
--
-- The scanner runs as service_role. mcp_reader and mcp_holder never touch
-- public.lessons -- 315 and 322 confined them to the mcp views -- so they get
-- nothing here, and 333 is what lets them see the effect through the view.

revoke all on public.mcp_leak_policy from anon, authenticated;

-- ===================== POST-CONDITIONS =====================

do $mig$
declare
  n_null   integer;
  n_true   integer;
  n_policy integer;
  v_thresh integer;
  blocked  boolean := false;
begin

  -- 1. THE DEFAULT IS CLOSED, AND EVERY EXISTING ROW TOOK IT.
  select count(*) filter (where mcp_servable),
         count(*) filter (where mcp_iso_longest_run is null)
    into n_true, n_null
    from public.lessons;
  if n_true <> 0 then
    raise exception 'expected 0 servable lessons before the scan, found %', n_true
      using hint = 'the column defaulted open';
  end if;
  raise notice 'lessons unscanned: % (all of them, by design)', n_null;

  -- 2. THE POLICY EXISTS AND IS SINGULAR.
  select count(*), max(threshold_words) into n_policy, v_thresh
    from public.mcp_leak_policy;
  if n_policy <> 1 then
    raise exception 'mcp_leak_policy holds % rows, expected 1', n_policy;
  end if;
  raise notice 'threshold: % words', v_thresh;

  -- 3. THE CONSTRAINT ACTUALLY REFUSES. Attempted, not inferred -- a CHECK that
  --    cannot fire is indistinguishable from one that passed, and this file has
  --    no other proof that servable-without-evidence is impossible.
  begin
    update public.lessons set mcp_servable = true
     where id = (select id from public.lessons limit 1);
    -- reached only if the constraint let it through
  exception when check_violation then
    blocked := true;
  end;
  if not blocked then
    raise exception 'a lesson was marked servable with no scan evidence'
      using hint = 'lessons_mcp_scan_coherent did not fire; nothing is committed';
  end if;
  raise notice 'constraint refuses servable-without-evidence';

  -- 4. THE TRIGGER ACTUALLY CLEARS. Same reasoning: run it as the thing it is
  --    about. A content edit must reset all four columns.
  declare
    v_id   uuid;
    v_srv  boolean;
    v_run  integer;
    v_body text;
  begin
    select id, content_md into v_id, v_body from public.lessons limit 1;
    -- Put the row in the state the trigger has to undo, supplying the evidence
    -- the constraint demands.
    update public.lessons
       set mcp_iso_longest_run = 3,
           mcp_scanned_at      = now(),
           mcp_scan_sources    = 'post-condition',
           mcp_servable        = true
     where id = v_id;

    -- Now change the body. Everything above must fall over.
    --
    -- THE BODY IS RESTORED IMMEDIATELY. A post-condition that leaves a trailing
    -- space in a live lesson has edited content to prove a point about content
    -- edits, and the round-trip is asserted rather than assumed -- this file
    -- would otherwise be the writer nobody listed.
    update public.lessons set content_md = content_md || ' ' where id = v_id;
    select mcp_servable, mcp_iso_longest_run into v_srv, v_run
      from public.lessons where id = v_id;
    update public.lessons set content_md = v_body where id = v_id;

    if v_srv is not false or v_run is not null then
      raise exception 'the trigger did not clear on a content_md change: servable=%, run=%', v_srv, v_run;
    end if;
    if (select content_md from public.lessons where id = v_id) is distinct from v_body then
      raise exception 'the probe did not restore the lesson body';
    end if;
    raise notice 'trigger clears the flag on a content edit; body restored';
  end;

  -- 5. AND A NON-CONTENT UPDATE MUST NOT CLEAR IT. The negative half: a trigger
  --    that clears on every update would make the flag unsettable by the
  --    scanner, which writes other columns in the same statement.
  declare
    v_id  uuid;
    v_srv boolean;
  begin
    select id into v_id from public.lessons limit 1;
    update public.lessons
       set mcp_iso_longest_run = 3,
           mcp_scanned_at      = now(),
           mcp_scan_sources    = 'post-condition',
           mcp_servable        = true
     where id = v_id;
    update public.lessons set order_index = order_index where id = v_id;
    select mcp_servable into v_srv from public.lessons where id = v_id;
    if v_srv is not true then
      raise exception 'a non-content update cleared the flag';
    end if;
    raise notice 'a non-content update leaves the flag alone';
  end;

  raise notice 'gate installed; views unchanged until 333';
end
$mig$;

-- The post-conditions above mutated one row to prove the mechanism. Undo it:
-- this migration must leave every lesson unscanned and unservable, which is the
-- state 333 and the scanner depend on.
update public.lessons
   set mcp_servable        = false,
       mcp_iso_longest_run = null,
       mcp_scanned_at      = null,
       mcp_scan_sources    = null
 where mcp_scan_sources = 'post-condition'
    or mcp_servable
    or mcp_iso_longest_run is not null;

do $mig$
declare n integer;
begin
  select count(*) into n from public.lessons
   where mcp_servable or mcp_iso_longest_run is not null or mcp_scan_sources is not null;
  if n <> 0 then
    raise exception 'post-condition residue on % lesson row(s)', n;
  end if;
  raise notice 'clean: every lesson unscanned and unservable';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
--   select count(*) filter (where mcp_servable) as servable,
--          count(*) filter (where mcp_iso_longest_run is null) as unscanned,
--          count(*) as total
--     from public.lessons;
--   -- expect servable 0, unscanned = total
--
--   select threshold_words, standards from public.mcp_leak_policy;
--   -- expect 10 and the three editions
--
--   select tgname, tgenabled from pg_trigger
--    where tgrelid = 'public.lessons'::regclass and not tgisinternal;
--   -- expect trg_lessons_clear_mcp_servable, enabled 'O'
--
-- NEXT: run scripts/scan-iso-leaks.mjs --apply, THEN migration 333.
