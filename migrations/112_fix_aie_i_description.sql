-- 112_fix_aie_i_description.sql
--
-- Rewrites the AIE-I marketing description.
--
-- WHY: the previous text opened with "A freemium AI-literacy credential...".
-- That describes the PRICING MODEL, not what the credential validates. Every
-- sibling cert opens with a scope statement ("Validates the craft of...",
-- "Validates that the holder can govern AI responsibly..."), and under
-- ISO/IEC 17024 the description is a scope claim, not a commercial one. Pricing
-- belongs on the pricing page.
--
-- ASCII ONLY, DELIBERATELY: this migration is pasted into the Supabase SQL
-- editor, which is the known source of double-encoded UTF-8 in this project.
-- The sibling descriptions contain em-dashes because they were loaded through
-- the API. This one uses a colon and commas instead so it cannot corrupt.
-- Do not "improve" the punctuation here without changing the load path.
--
-- Idempotent: sets an absolute value, keyed on code. Safe to re-run.

do $$
declare
  v_rows integer;
begin
  update public.certifications
     set description =
       'AI-literacy certification for non-technical professionals. '
       'Validates that the holder can understand, evaluate, and use everyday '
       'AI tools safely and effectively at work: recognizing what these tools '
       'do well, where they fail, and how to apply them with sound judgment.'
   where code = 'AIE-I';

  get diagnostics v_rows = row_count;

  if v_rows <> 1 then
    raise exception 'Expected exactly 1 AIE-I row, updated %', v_rows;
  end if;

  raise notice 'AIE-I description updated.';
end $$;

-- Verify:
--   select code, left(description, 80) from public.certifications where code = 'AIE-I';
