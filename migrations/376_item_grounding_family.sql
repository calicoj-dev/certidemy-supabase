-- 376_item_grounding_family.sql
--
-- ONE COLUMN: item_grounding.grounding_family, the clause an item's key anchors in.
--
-- ============ WHY IT IS A COLUMN AND NOT A DERIVATION ============
--
-- `item_grounding.key_support_clause` already records the anchor, so the family could be
-- computed from it. It is stored anyway, and the reason is what it is FOR: the form
-- assembler will later dedupe on it the way it now dedupes on stem identity, and a
-- deduping key that each reader derives for itself is a computation with several
-- implementations. This repository records that shape -- two hand-written lists of one
-- idea diverge, and the divergence surfaces as a refusal of correct work.
--
-- Cross-cueing was measured on the first pilot and it is real. Three clusters of items
-- would have given each other away on one form:
--
--   {#3, #21}         drift, both anchored in B.6.2.6
--   {#8, #24, #31}    impact-assessment results feeding the risk assessment, 6.1.4
--   {#9, #18, #19}    justification for inclusion and exclusion, 6.1.3 f) and B.1
--
-- A candidate who reads one of those learns the answer to the others. Stem identity cannot
-- see it: the stems are different, which is exactly why the existing dedupe misses it.
--
-- ============ THIS MIGRATION DOES NOT CHANGE FORM ASSEMBLY ============
--
-- `generate-mock-exam` is NOT touched, by instruction. This adds the column and records the
-- family; the director rules on whether the assembler dedupes on it after the next read.
-- A column nobody reads yet is the cheap half, and it is the half that has to exist first --
-- the alternative is a later migration plus a backfill of items whose anchors nobody kept.
--
-- ============ ONE STATEMENT ============
--
-- A single DO block: `begin; ... commit;` in the SQL editor asserts an INTENT and not a
-- transaction, so a post-condition outside one cannot roll back its own write.

do $$
declare
  n_col int;
  anon_can boolean;
begin
  alter table public.item_grounding
    add column if not exists grounding_family text;

  comment on column public.item_grounding.grounding_family is
    'The clause an item''s key anchors in -- the ANCHOR FAMILY. Two items in different '
    'tasks whose keys rest on the same clause cross-cue each other on one form, and stem '
    'identity cannot see it because their stems differ. Recorded by '
    'scripts/gen-grounded-items.mjs. generate-mock-exam does NOT read it yet; that is a '
    'separate decision. See migration 376.';

  create index if not exists item_grounding_family
    on public.item_grounding (grounding_family)
    where grounding_family is not null;

  ---------------------------------------------------------------------------
  -- POST-CONDITIONS. A property, not a count, and both directions.
  ---------------------------------------------------------------------------

  -- (1) the column is there and is text
  select count(*) into n_col from information_schema.columns
   where table_schema = 'public' and table_name = 'item_grounding'
     and column_name = 'grounding_family' and data_type = 'text';
  if n_col <> 1 then
    raise exception 'item_grounding.grounding_family is absent or not text (found % matching column(s))', n_col;
  end if;

  -- (2) AND THE NEGATIVE HALF: adding a column must not have opened the table. These rows
  --     quote licensed standard text as evidence, so anon and authenticated stay refused.
  --     Asked with has_table_privilege against the OID, never by reading an ACL: an ACL
  --     comparison sees only what someone typed and misses membership.
  select bool_or(has_table_privilege(r, 'public.item_grounding'::regclass, 'SELECT'))
    into anon_can
    from (values ('anon'), ('authenticated')) as t(r);
  if coalesce(anon_can, false) then
    raise exception 'anon or authenticated can SELECT item_grounding -- licensed text would be readable through PostgREST';
  end if;

  -- (3) service_role still can, or the generator cannot record what it anchored
  if not has_table_privilege('service_role', 'public.item_grounding'::regclass, 'SELECT') then
    raise exception 'service_role cannot SELECT item_grounding';
  end if;

  -- (4) RLS was not disturbed
  if not exists (
    select 1 from pg_class
     where relname = 'item_grounding' and relnamespace = 'public'::regnamespace and relrowsecurity
  ) then
    raise exception 'row level security is no longer enabled on item_grounding';
  end if;

  raise notice '376 ok: item_grounding.grounding_family added, indexed where not null, anon and authenticated still refused, RLS intact';
end $$;

-- ---------------------------------------------------------------------------
-- FINGERPRINT: it is IN scripts/check-migration-state.mjs, not here. A fingerprint written
-- as a comment in a migration is inert -- the probe reads its own FINGERPRINTS table and
-- nothing parses this file.
--
-- 376's entry asserts the column exists AND that anon is still refused on the table, because
-- the interesting half of a migration that only adds a column is whether it changed anything
-- it was not supposed to.
-- ---------------------------------------------------------------------------
