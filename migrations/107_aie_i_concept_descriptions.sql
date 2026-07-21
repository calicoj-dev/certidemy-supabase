-- 107_aie_i_concept_descriptions.sql
-- Certidemy — AIE-I (22222222-2222-2222-2222-222222222222)
--
-- Migration 104 rebuilt AIE-I from committed sources. Concept SLUGS and linkage
-- were recovered exactly (47/47 resolved at wire time), but the 47 concept
-- DESCRIPTION fields existed only in the lost database and were reconstructed
-- from each task's KSA lines. Five were flagged as likely thinner than what the
-- lessons actually teach and than what the secure items already test against.
--
-- This migration replaces those five descriptions with definitions that state
-- the boundary of the concept, not just a category label. Two of the five
-- (ai-limitations / genai-limitations) previously overlapped enough that an item
-- writer could not tell them apart; they are now explicitly disjoint —
-- genai-limitations is about generative text tools specifically, ai-limitations
-- is the broader class of limits that applies to AI systems generally.
--
-- Slugs, names, and all linkage are untouched. Description text only.
-- Idempotent: straight UPDATE, safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 0. Guard — the cert must be AIE-I at the expected slot
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from public.certifications
    where id = '22222222-2222-2222-2222-222222222222'
      and code = 'AIE-I'
  ) then
    raise exception '107 ABORT: 2222 slot does not hold AIE-I';
  end if;

  if (
    select count(*) from public.concepts
    where certification_id = '22222222-2222-2222-2222-222222222222'
      and slug in ('genai-capabilities','genai-limitations','ai-limitations',
                   'prompt-structure','right-tool-for-task')
  ) <> 5 then
    raise exception '107 ABORT: expected all 5 target concept slugs to exist';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Descriptions
-- ---------------------------------------------------------------------------

update public.concepts set description =
  'What generative AI does reliably well: drafting and restructuring text, '
  'summarizing supplied material, rephrasing for a different audience or tone, '
  'translating, and producing options a person can react to. The common thread '
  'is language transformation where the source material is provided or the '
  'output will be judged by the user — not tasks that require the tool to be '
  'the authority on what is true.'
where certification_id = '22222222-2222-2222-2222-222222222222'
  and slug = 'genai-capabilities';

update public.concepts set description =
  'Where generative text tools predictably fail: they state false information '
  'fluently and without signalling doubt, are unreliable at arithmetic and '
  'counting, know nothing of events after training unless it is supplied to '
  'them, and invent plausible-looking sources, citations, and quotations. These '
  'follow from how the tool works and are not defects awaiting a patch, so the '
  'response is verification, not a better prompt.'
where certification_id = '22222222-2222-2222-2222-222222222222'
  and slug = 'genai-limitations';

update public.concepts set description =
  'Limits that apply to AI systems generally, beyond generative text tools: '
  'they cannot check their own output against the world, degrade on situations '
  'unlike anything in their training, can return different answers to the same '
  'question on different runs, and bear no accountability for what they '
  'produce. Recognizing these bounds is what separates delegating a task to AI '
  'from abdicating it.'
where certification_id = '22222222-2222-2222-2222-222222222222'
  and slug = 'ai-limitations';

update public.concepts set description =
  'The components of an effective prompt — task, context, supplied input, '
  'output format, and constraints — and how they combine. A prompt that names '
  'the audience and purpose, hands over the source material instead of relying '
  'on the model to recall it, states the shape of the answer wanted, and says '
  'what to leave out produces usable output far more consistently than a bare '
  'question.'
where certification_id = '22222222-2222-2222-2222-222222222222'
  and slug = 'prompt-structure';

update public.concepts set description =
  'Choosing deliberately among generative AI, conventional software, a search, '
  'a colleague, and doing the work yourself, rather than reaching for AI by '
  'default. AI fits when the output is language, the input can be supplied, and '
  'a person will review the result; it is the wrong instrument when the task '
  'needs a guaranteed-correct calculation, an authoritative source, a '
  'confidentiality guarantee, or someone accountable for the outcome.'
where certification_id = '22222222-2222-2222-2222-222222222222'
  and slug = 'right-tool-for-task';

-- ---------------------------------------------------------------------------
-- 2. Verify before commit — all five must have grown
-- ---------------------------------------------------------------------------
do $$
declare
  n_short int;
begin
  select count(*) into n_short
  from public.concepts
  where certification_id = '22222222-2222-2222-2222-222222222222'
    and slug in ('genai-capabilities','genai-limitations','ai-limitations',
                 'prompt-structure','right-tool-for-task')
    and length(description) < 200;
  if n_short > 0 then
    raise exception '107 ABORT: % description(s) did not take', n_short;
  end if;
end $$;

commit;

-- ---------------------------------------------------------------------------
-- 3. Readout
-- ---------------------------------------------------------------------------
select slug, name, length(description) as len, description
from public.concepts
where certification_id = '22222222-2222-2222-2222-222222222222'
  and slug in ('genai-capabilities','genai-limitations','ai-limitations',
               'prompt-structure','right-tool-for-task')
order by slug;
