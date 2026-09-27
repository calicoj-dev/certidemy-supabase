-- 377_source_passage_translations.sql
--
-- PARALLEL TEXT: the same passage, another language, at the SAME ADDRESS.
--
-- ============ WHY A TABLE AND NOT A SOURCE ============
--
-- The official Spanish and Portuguese editions of Regulation (EU) 2024/1689 are not
-- separate sources. They are the same Regulation, article for article and paragraph
-- for paragraph, and their job here is TERMINOLOGY: what the Regulation itself calls
-- a deployer in Spanish is `responsable del despliegue`, and that is a fact about a
-- passage rather than a passage of its own.
--
-- Loading them as sources would give the same requirement two addresses, and a gate
-- that anchors an item in one would have no idea the other existed. So a translation
-- hangs off the English row by foreign key, and `Art. 50(2)` means one thing.
--
-- ============ IT IS A REFERENCE, NOT A MANDATE, AND THAT IS IN THE COMMENT ============
--
-- The EU's Spanish is SPAIN Spanish. Our Spanish is es-419. `apartado` against
-- `cláusula` is the same shape this repository already paid for: a sweep was scoped
-- from AENOR's convention and would have rewritten 10,470 occurrences, 476 of them in
-- live secure exam items, to make the 98 percent match the 2 percent.
--
-- So the column comment says it: this is EVIDENCE OF WHAT THE REGULATION SAYS, and
-- the house glossary decides what we write. A term taken off an EU translation and
-- shipped would arrive carrying the Regulation's authority for a choice the
-- Regulation did not make for Latin America.
--
-- ============ INTERNAL ONLY, LIKE THE PASSAGES THEMSELVES ============
--
-- The AI Act is public law, so the licensing argument does not apply to its text --
-- but the ACCESS argument is unchanged. This table is the generator's reference and
-- the gates' evidence; nothing serves it, and the grants give service_role only. The
-- negative half is asserted below, on this table, for the same reason 375 asserts it
-- on all three of its own: a negative half that checks only the table you were
-- thinking about passes while the hole sits next to it.
--
-- ============ WHAT IS LOADED, AND WHAT IS NOT ============
--
-- Measured 2026-09-26, by the one extractor:
--
--   EU AI Act es    964 rows aligned BY ID     17 translated units unaligned
--   EU AI Act pt    976 rows aligned BY ID     11 translated units unaligned
--   EBM Guide es      0 rows -- NOT ALIGNED    17 translated units, 38 English
--   EBM Guide pt      0 rows -- NOT ALIGNED    12 translated units, 38 English
--
-- The EBM Guide has no numbering of any kind: its ids are its own English headings, so
-- a translated heading can only be matched BY POSITION. The heading counts disagree,
-- so nothing is aligned and nothing is written. `aligned_by` records which mechanism
-- placed a row, because "matched by id" and "matched by position" are different
-- claims and a column that flattens them would let the weaker one be read as the
-- stronger. There is no `by-order` row today; the value exists so that if one is ever
-- written, it says so.
--
-- ARTICLE STRUCTURE IS IDENTICAL IN ALL THREE LANGUAGES, asserted rather than assumed:
-- 113 of 113 articles, and every article's paragraph count agreeing. The first run
-- reported 116 differences and every one of them was a defect in my own extractor --
-- the Portuguese ordinal `Artigo 1.o`, the Spanish `1)` definition numbering, the
-- Spanish `a)` annex points, an English cross-reference read as a heading. 13 English
-- annex points have no Spanish row and 2 have no Portuguese row; they are named in
-- SOURCE-PASSAGES.json rather than counted here.
--
-- ============ ONE STATEMENT, DELIBERATELY ============
--
-- `begin; ... commit;` in the SQL editor asserts an INTENT and not a transaction: a
-- paste may be split, and a post-condition that cannot roll back its own writes is a
-- comment. One DO block is one transaction under every pooling mode.

do $$
declare
  n_cols int;
  anon_can boolean;
  n_fk int;
begin
  ---------------------------------------------------------------------------
  -- One row per (English passage, language).
  ---------------------------------------------------------------------------
  create table if not exists public.source_passage_translations (
    id           uuid primary key default gen_random_uuid(),
    -- THE KEY IS THE ENGLISH PASSAGE. On delete cascade, because a translation of a
    -- passage that no longer exists is a row pointing at an address nobody holds --
    -- the junk-at-a-real-address shape, which is worse than an absence.
    passage_id   uuid not null references public.source_passages(id) on delete cascade,
    language     text not null,
    text         text not null,
    -- Which mechanism placed this row. 'id' is a structural match on the document's
    -- own numbering; 'order' is an assumption about position. They are not the same
    -- evidence and the column refuses to pretend they are.
    aligned_by   text not null,
    extracted_from text not null,
    loaded_at    timestamptz not null default now(),
    constraint spt_unique unique (passage_id, language),
    -- The vocabulary is closed on both columns. A language nobody declared would make
    -- a lookup silently return nothing, which is the empty-result-as-an-answer shape.
    constraint spt_language_chk check (language in ('es', 'pt')),
    constraint spt_aligned_chk check (aligned_by in ('id', 'order')),
    constraint spt_text_nonempty check (length(btrim(text)) >= 20)
  );

  comment on table public.source_passage_translations is
    'Official translations of held source passages, at the SAME clause address as the '
    'English. INTERNAL ONLY -- never served to a candidate or a partner. Its purpose is '
    'terminology: what a standard or regulation itself calls a thing in Spanish or '
    'Portuguese. See migration 377 and SOURCE-PASSAGES.json.';
  comment on column public.source_passage_translations.language is
    'es or pt. THE EU''S SPANISH IS SPAIN SPANISH and ours is es-419, so this is a '
    'REFERENCE for what the Regulation says, never a mandate for what we write. The '
    'house glossary decides. A term lifted from here into learner-facing content would '
    'arrive carrying the Regulation''s authority for a choice it did not make for '
    'Latin America.';
  comment on column public.source_passage_translations.aligned_by is
    'id = matched on the document''s own numbering, which is identical across the '
    'three EU editions and therefore evidence. order = matched by position, which is '
    'an assumption. Nothing is written as ''order'' today.';

  create index if not exists spt_lookup
    on public.source_passage_translations (passage_id, language);

  ---------------------------------------------------------------------------
  -- GRANTS. service_role only, and RLS on so the table is closed by default.
  -- RLS IS NOT A GRANT: the table-level grant is checked BEFORE row-level
  -- security, so a table with RLS and no grant is closed and a table with a grant
  -- and no policies is open. Both halves are set here.
  ---------------------------------------------------------------------------
  alter table public.source_passage_translations enable row level security;
  revoke all on public.source_passage_translations from anon, authenticated;
  grant select, insert, update, delete on public.source_passage_translations to service_role;

  ---------------------------------------------------------------------------
  -- POST-CONDITIONS. Both directions, and no literal counts.
  ---------------------------------------------------------------------------

  -- (1) the shape exists
  select count(*) into n_cols from information_schema.columns
   where table_schema = 'public' and table_name = 'source_passage_translations'
     and column_name in ('passage_id','language','text','aligned_by','extracted_from');
  if n_cols <> 5 then
    raise exception 'source_passage_translations is missing columns: found % of the 5 required', n_cols;
  end if;

  -- (2) THE FOREIGN KEY IS THE POINT OF THE DESIGN, so it is asserted rather than
  --     assumed. Without it this is a second source wearing a language column, and a
  --     translation could outlive the passage it translates.
  select count(*) into n_fk
    from pg_constraint
   where conrelid = 'public.source_passage_translations'::regclass
     and contype = 'f'
     and confrelid = 'public.source_passages'::regclass;
  if n_fk < 1 then
    raise exception 'no foreign key from source_passage_translations to source_passages';
  end if;

  -- (3) service_role CAN read it. A revoke that over-reached would leave the
  --     terminology unreadable and the failure would look like an empty table.
  if not has_table_privilege('service_role', 'public.source_passage_translations'::regclass, 'SELECT') then
    raise exception 'service_role cannot SELECT source_passage_translations';
  end if;

  -- (4) AND THE NEGATIVE HALF. Asserted with has_table_privilege rather than by
  --     reading an ACL: an ACL comparison sees only what someone typed and misses
  --     membership, which is how a check once reported no gap while the role running
  --     it was in the gap.
  select bool_or(has_table_privilege(t.r, 'public.source_passage_translations'::regclass, 'SELECT'))
    into anon_can
    from (values ('anon'), ('authenticated')) as t(r);
  if coalesce(anon_can, false) then
    raise exception 'anon or authenticated can SELECT source_passage_translations -- it would be readable through PostgREST';
  end if;

  -- (5) AND RLS IS STILL ON. A grant plus no policies is open; a grant plus RLS and
  --     no policies is closed. This asserts the half that is easy to lose.
  if not exists (
    select 1 from pg_class
     where oid = 'public.source_passage_translations'::regclass and relrowsecurity
  ) then
    raise exception 'row level security is not enabled on source_passage_translations';
  end if;

  raise notice '377 ok: source_passage_translations created, service_role only, RLS on, FK asserted';
end $$;
