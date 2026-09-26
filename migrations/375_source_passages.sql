-- 375_source_passages.sql
--
-- THE SOURCE LIBRARY. An item is only as true as the passage it can point to, and
-- the pointing is checked by code rather than by a model.
--
-- ============ WHY THIS TABLE EXISTS ============
--
-- GENERATOR-SOURCE-ACCESS.md measured it: gen-cert-secure.mjs, the only writer of
-- pool='secure', never opens a source document. Zero references to pdftotext, the
-- citation index, the ISO locator or clauseText in any of the five files in its
-- chain. The nine ISO PDFs and the 2020 Scrum Guide sit on disk unread, and every
-- clause number in 12,462 secure rows was written from recall.
--
-- Two audits then found what recall produces: 16 wrong keys in 822 items read,
-- clustering by SOURCE rather than by language -- 2017 Scrum Guide wording,
-- 19011:2018-style clause numbers, and requirements the standards do not contain.
--
-- ============ EDITIONS ARE PINNED, AND ONE IS DELIBERATELY ABSENT ============
--
-- The 2020 Scrum Guide is loaded. The 2017 Guide is NOT, and not because we lack a
-- copy: a library the generator quotes from must not contain the edition whose
-- wording we are trying to stop it reproducing. Superseded wording is refused by a
-- code gate, never handled by making the old text available.
--
-- ============ INTERNAL ONLY. NEVER SERVED ============
--
-- These rows are licensed standard text. They are the generator's reference and the
-- gates' evidence; they are NOT content. No view exposes them, no function returns
-- them, and the grants below give service_role only -- anon and authenticated get
-- nothing, so PostgREST cannot read the table at all.
--
-- The leak scanner still guards everything that IS served. This table does not
-- change what a candidate or a partner can see; it changes what the generator is
-- allowed to assert.
--
-- ============ ONE STATEMENT, DELIBERATELY ============
--
-- CLAUDE.md records that `begin; ... commit;` in the SQL editor asserts an INTENT
-- and not a transaction: a paste may be split, and a post-condition that cannot
-- roll back its own writes is a comment. So this is a single DO block -- one
-- statement is one transaction under every pooling mode -- with the DDL inside it
-- and the post-conditions raising before it can commit.

do $$
declare
  n_cols int;
  n_grants int;
  anon_can boolean;
begin
  ---------------------------------------------------------------------------
  -- source_passages: one row per clause of one edition of one document.
  ---------------------------------------------------------------------------
  create table if not exists public.source_passages (
    id           uuid primary key default gen_random_uuid(),
    source_id    text not null,          -- 'ISO/IEC 42001', 'Scrum Guide'
    edition      text not null,          -- '2023', '2022/Amd1:2024', '2020'
    clause       text not null,          -- '9.3.2', 'A.7.5', 'B.6.2.6', 'Sprint Review'
    title        text,
    text         text not null,
    normative    text not null,
    extracted_from text not null,        -- file the bytes came from
    page_hint    int,                    -- null where the extractor cannot say
    loaded_at    timestamptz not null default now(),
    constraint source_passages_unique unique (source_id, edition, clause),
    -- The vocabulary is closed. A passage whose modal nobody classified would make
    -- the modal-fidelity gate silently permissive, which is the failure mode this
    -- whole design exists to remove.
    constraint source_passages_normative_chk
      check (normative in ('shall', 'should', 'can', 'informative')),
    -- An empty passage is not a passage. The extractor already refuses to emit one;
    -- this makes it impossible to insert by any other route.
    constraint source_passages_text_nonempty check (length(btrim(text)) >= 20)
  );

  comment on table public.source_passages is
    'Licensed standard text, clause by clause. INTERNAL ONLY -- never served to a '
    'candidate or a partner, and no view exposes it. The generator quotes from it and '
    'the code gates check the quote. Editions are pinned; the 2017 Scrum Guide is '
    'deliberately absent. See GENERATOR-SOURCE-ACCESS.md and migration 375.';
  comment on column public.source_passages.normative is
    'The passage''s own strongest modal: shall | should | can | informative. The '
    'modal-fidelity gate compares an item''s claim against this, so "can include" '
    'cannot become "must".';

  create index if not exists source_passages_lookup
    on public.source_passages (source_id, edition, clause);

  ---------------------------------------------------------------------------
  -- task_sources: which passages a task is examined against.
  ---------------------------------------------------------------------------
  create table if not exists public.task_sources (
    task_id    uuid not null references public.tasks(id) on delete cascade,
    passage_id uuid not null references public.source_passages(id) on delete cascade,
    -- 'primary' is what the task is ABOUT; 'supporting' is context the item may
    -- rely on. The generator is given both and must anchor its key in one of them.
    role       text not null default 'primary',
    added_by   text not null,
    added_at   timestamptz not null default now(),
    primary key (task_id, passage_id),
    constraint task_sources_role_chk check (role in ('primary', 'supporting'))
  );

  comment on table public.task_sources is
    'Blueprint anchor: the passages each task is examined against. The grounded '
    'generator receives the full text of these and may anchor a key only in them.';

  ---------------------------------------------------------------------------
  -- item_grounding: what an item points at, and which gates cleared it.
  --
  -- THE ANCHOR IS INTERNAL AND IS NOT AN EXPLANATION. `key_support` is a sentence
  -- copied verbatim out of a licensed standard: it is the EVIDENCE that the item is
  -- supported, held so a human or a re-run can check the pointing. It is never shown
  -- to a candidate, never returned by an edge function, and never served through MCP.
  -- The explanation a candidate reads lives on quiz_questions, in our own words.
  --
  -- `gates` RECORDS WHICH GATES CLEARED THE ITEM, not a boolean. A row saying only
  -- "passed" cannot answer the question that matters six months from now: passed
  -- WHAT? Gates get added and tightened, and an item cleared by four gates is not an
  -- item cleared by six. Storing the verdict per gate is what makes a later tightening
  -- able to name the rows it has not been applied to.
  ---------------------------------------------------------------------------
  create table if not exists public.item_grounding (
    question_id  uuid primary key references public.quiz_questions(id) on delete cascade,
    key_support_clause text not null,
    key_support  text not null,
    source_id    text not null,
    edition      text not null,
    -- [{id, pass, examined, reason}] per gate, plus the blind solver's verdict.
    gates        jsonb not null,
    solver       jsonb,
    generator    text not null,      -- which path wrote it
    model        text,
    created_at   timestamptz not null default now(),
    constraint item_grounding_support_nonempty check (length(btrim(key_support)) >= 20),
    -- A gate list that is not an array is not a record of gates.
    constraint item_grounding_gates_array check (jsonb_typeof(gates) = 'array')
  );

  comment on table public.item_grounding is
    'Per-item anchoring: the exact passage sentence supporting the key, and the verdict '
    'of every gate that examined the item. INTERNAL ONLY -- licensed standard text, never '
    'served to a candidate or a partner. Written by the grounded generator path '
    '(scripts/gen-grounded-items.mjs); the old gen-cert-secure.mjs path writes no row '
    'here, so an ABSENT row means an item nothing anchored, which is the honest state for '
    'the 12,462 secure rows written from recall.';

  ---------------------------------------------------------------------------
  -- INTERNAL ONLY. The grants are the enforcement, not the comment above.
  ---------------------------------------------------------------------------
  revoke all on public.source_passages from public;
  revoke all on public.task_sources from public;
  revoke all on public.item_grounding from public;
  grant select, insert, update, delete on public.source_passages to service_role;
  grant select, insert, update, delete on public.task_sources to service_role;
  grant select, insert, update, delete on public.item_grounding to service_role;

  -- RLS on with NO policy: a table with RLS enabled and no grant is closed, and
  -- CLAUDE.md records that the table-level grant is checked BEFORE row-level
  -- security. Both halves are set here so neither alone is load-bearing.
  alter table public.source_passages enable row level security;
  alter table public.task_sources enable row level security;
  alter table public.item_grounding enable row level security;

  ---------------------------------------------------------------------------
  -- POST-CONDITIONS. Both directions, and no literal counts.
  ---------------------------------------------------------------------------

  -- (1) the shape exists
  select count(*) into n_cols from information_schema.columns
   where table_schema = 'public' and table_name = 'source_passages'
     and column_name in ('source_id','edition','clause','text','normative','extracted_from');
  if n_cols <> 6 then
    raise exception 'source_passages is missing columns: found % of the 6 required', n_cols;
  end if;

  -- (2) service_role CAN read it. A revoke that over-reached would leave the
  --     generator unable to see its own library, and the failure would surface as
  --     empty passages rather than as a permission error.
  if not has_table_privilege('service_role', 'public.source_passages'::regclass, 'SELECT') then
    raise exception 'service_role cannot SELECT source_passages -- the generator would read nothing';
  end if;
  if not has_table_privilege('service_role', 'public.task_sources'::regclass, 'SELECT') then
    raise exception 'service_role cannot SELECT task_sources';
  end if;

  -- (3) AND THE NEGATIVE HALF, which is the one that matters: anon and
  --     authenticated must NOT be able to read licensed standard text. Asserted
  --     with has_table_privilege rather than by reading an ACL, because an ACL
  --     comparison sees only what someone typed and misses membership -- the
  --     defect this repository already recorded against pg_read_all_data.
  --     ALL THREE TABLES, not just the first: item_grounding stores the same licensed
  --     sentences as evidence, so a grant there leaks exactly what a grant on
  --     source_passages would. Asserting only the table you were thinking about is how a
  --     negative half passes while the hole is next to it.
  --     The OID overload (::regclass) rather than the text-name one: CLAUDE.md records a
  --     constructed identifier inside a WHERE clause becoming a lookup on a row a later
  --     predicate would have excluded. These are literals and could not be misresolved, but
  --     the rule is "ask about the OBJECT" and there is no reason to write the weaker form.
  select bool_or(has_table_privilege(t.r, t.tbl, 'SELECT'))
    into anon_can
    from (values
      ('anon', 'public.source_passages'::regclass), ('authenticated', 'public.source_passages'::regclass),
      ('anon', 'public.task_sources'::regclass),    ('authenticated', 'public.task_sources'::regclass),
      ('anon', 'public.item_grounding'::regclass),  ('authenticated', 'public.item_grounding'::regclass)
    ) as t(r, tbl);
  if coalesce(anon_can, false) then
    raise exception 'anon or authenticated can SELECT one of the three tables -- licensed text would be readable through PostgREST';
  end if;
  if not has_table_privilege('service_role', 'public.item_grounding'::regclass, 'SELECT') then
    raise exception 'service_role cannot SELECT item_grounding';
  end if;

  -- (4) RLS is on for all three
  select count(*) into n_grants from pg_class
   where relname in ('source_passages','task_sources','item_grounding')
     and relnamespace = 'public'::regnamespace and relrowsecurity;
  if n_grants <> 3 then
    raise exception 'row level security is enabled on % of 3 tables', n_grants;
  end if;

  raise notice '375 ok: source_passages, task_sources and item_grounding created, service_role only, RLS on all three, anon and authenticated refused on all three';
end $$;

-- ---------------------------------------------------------------------------
-- FINGERPRINT: it is IN scripts/check-migration-state.mjs, not here.
--
-- A fingerprint written as a comment in a migration is inert -- the probe reads its own
-- FINGERPRINTS table and nothing parses this file, so an earlier draft of these lines
-- looked like a fingerprint and reported "no probe". 375's entry lives in that script.
--
-- What it asserts, because the interesting half is not existence: `ran` is that all three
-- tables are reachable with the service-role key, and `effective` is that ANON IS REFUSED
-- on source_passages, asked with the anon key rather than inferred. A probe that only
-- checked existence would report green on a table PostgREST was serving to the world,
-- which is the one failure that matters for licensed text. With no SUPABASE_ANON_KEY it
-- reports UNASSERTED rather than confirmed.
-- ---------------------------------------------------------------------------
--
-- THE LOADER IS SEPARATE AND IS NOT THIS FILE.
--   node --dns-result-order=ipv4first scripts/load-source-passages.mjs --apply
-- It inserts SOURCE-PASSAGES.json, which is the same artifact the gates and the
-- pilot already read, so the table and the pilot cannot disagree about what a
-- passage says. Loading is idempotent on (source_id, edition, clause).
