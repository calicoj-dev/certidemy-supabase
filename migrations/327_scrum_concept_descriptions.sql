-- 327_scrum_concept_descriptions.sql
--
-- Eight `concepts.description` rows on the Scrum certifications where the 2020
-- Scrum Guide's sentence WAS the definition, plus one editorial note that was
-- never meant to be read by a partner.
--
-- ===================== WHY REWRITE AND NOT MARK =====================
--
-- `get_concept` promises the caller "what it means AS CERTIDEMY DEFINES IT".
-- A quotation in that field breaks the field's contract no matter who owns the
-- words, and MARKING a quotation there only makes the breach explicit -- it
-- would read "as Certidemy defines it: <somebody else's sentence>".
--
-- This is not the licence question. The Scrum Guide is CC BY-SA and original
-- prose about it is the basis every Scrum trainer works on; ShareAlike is not
-- what is being settled here. These eight are defects on their own merits.
--
-- ===================== THE NOTE THAT IS A DIFFERENT DEFECT =====================
--
-- `true-leadership` read "Scrum Guide 2020 phrasing; servant-leadership
-- substance retained." That is an editorial note -- a message from one author to
-- the next -- sitting in a field an MCP client renders to a partner. Same class
-- as `tables_read` leaking internal table names into a partner-facing analyzer
-- response: correct, useful internally, and nothing a customer's answer should
-- carry. It is replaced with an actual definition rather than deleted.
--
-- ===================== WHAT WAS CHECKED BEFORE WRITING =====================
--
-- Every replacement was run against `reference/scrum-guide-2020.txt` and shares
-- NO RUN OF FIVE OR MORE CONSECUTIVE WORDS with it. The check caught one draft:
-- "one person, not a committee" is the Guide's own phrase, written back in by
-- hand while trying to avoid doing exactly that. The longest surviving overlap
-- is four words, "the sprint goal and", which is unavoidable domain vocabulary.
--
-- An 8-word threshold WOULD NOT HAVE FOUND THESE DEFECTS in the first place.
-- `team-size` read "Typically 10 or fewer people." -- five words, verbatim, and
-- the entire definition. The defect is definitional identity, not run length,
-- and the sweep that measures runs is the wrong instrument for finding it. It is
-- the right instrument for checking the replacements, which is why it is used
-- here and not there.
--
-- ===================== SCOPED BY (CODE, SLUG), NEVER BY SLUG =====================
--
-- `sprint-goal` exists on SM-AI-I and SD-AI-I; `daily-scrum` on SM-AI-I,
-- SD-AI-I and SM-AI-II. A slug-only update would have hit rows nobody reviewed.
-- The record this came from named five SLUGS; they are eight ROWS.
--
-- ===================== THE ROW THAT MUST NOT CHANGE =====================
--
-- SD-AI-I / daily-scrum reads "The Developers' 15-minute inspect-and-adapt
-- event." -- Certidemy's own compression. "15-minute" is a fact, not the Guide's
-- expression, and nothing else there is theirs. It is asserted UNCHANGED below,
-- because a post-condition that only proves the seven landed would pass just as
-- cleanly on an update that also took this one.
--
-- Tasks were examined and need nothing: every verbatim run sits in `knowledge`,
-- and the task STATEMENTS -- which is what standard-setting rests on -- are
-- Certidemy's own JTA prose throughout.

begin;

do $mig$
declare
  n integer := 0;
  k integer;
  untouched text;
begin

  -- SM-AI-I / sprint-goal
  --   was: Singular objective for the Sprint
  update public.concepts co
     set description = $d$What the Sprint is for: the one outcome the Developers work toward. Fixed once the Sprint starts, while the work chosen to reach it stays negotiable.$d$
    from public.certifications c
   where c.id = co.certification_id
     and c.code = 'SM-AI-I'
     and co.slug = 'sprint-goal';
  get diagnostics k = row_count; n := n + k;
  if k <> 1 then
    raise exception 'concept row not matched'
      using detail = 'SM-AI-I / sprint-goal', hint = 'nothing is committed';
  end if;
  -- SD-AI-I / sprint-goal
  --   was: The single objective for the Sprint.
  update public.concepts co
     set description = $d$The one outcome a Sprint exists to achieve. It is agreed at Sprint Planning and does not change mid-Sprint.$d$
    from public.certifications c
   where c.id = co.certification_id
     and c.code = 'SD-AI-I'
     and co.slug = 'sprint-goal';
  get diagnostics k = row_count; n := n + k;
  if k <> 1 then
    raise exception 'concept row not matched'
      using detail = 'SD-AI-I / sprint-goal', hint = 'nothing is committed';
  end if;
  -- SM-AI-I / product-backlog
  --   was: Emergent, ordered list
  update public.concepts co
     set description = $d$The one ordered source of work for the product. Never finished: items are added, reordered and dropped as the team learns.$d$
    from public.certifications c
   where c.id = co.certification_id
     and c.code = 'SM-AI-I'
     and co.slug = 'product-backlog';
  get diagnostics k = row_count; n := n + k;
  if k <> 1 then
    raise exception 'concept row not matched'
      using detail = 'SM-AI-I / product-backlog', hint = 'nothing is committed';
  end if;
  -- SM-AI-I / team-size
  --   was: Typically 10 or fewer people.
  update public.concepts co
     set description = $d$Scrum Teams are kept small - ten people or fewer in practice - so coordination stays cheap and the team can still finish real work in a Sprint.$d$
    from public.certifications c
   where c.id = co.certification_id
     and c.code = 'SM-AI-I'
     and co.slug = 'team-size';
  get diagnostics k = row_count; n := n + k;
  if k <> 1 then
    raise exception 'concept row not matched'
      using detail = 'SM-AI-I / team-size', hint = 'nothing is committed';
  end if;
  -- SM-AI-I / daily-scrum
  --   was: 15-minute Developer-owned event
  update public.concepts co
     set description = $d$A 15-minute working session the Developers hold for themselves each day, to re-plan the coming day against the Sprint Goal.$d$
    from public.certifications c
   where c.id = co.certification_id
     and c.code = 'SM-AI-I'
     and co.slug = 'daily-scrum';
  get diagnostics k = row_count; n := n + k;
  if k <> 1 then
    raise exception 'concept row not matched'
      using detail = 'SM-AI-I / daily-scrum', hint = 'nothing is committed';
  end if;
  -- SM-AI-II / daily-scrum
  --   was: inspect progress toward the Sprint Goal and adapt
  update public.concepts co
     set description = $d$The Developers' daily 15-minute re-plan: what changed, what it means for the Sprint Goal, and what the Sprint Backlog should now say.$d$
    from public.certifications c
   where c.id = co.certification_id
     and c.code = 'SM-AI-II'
     and co.slug = 'daily-scrum';
  get diagnostics k = row_count; n := n + k;
  if k <> 1 then
    raise exception 'concept row not matched'
      using detail = 'SM-AI-II / daily-scrum', hint = 'nothing is committed';
  end if;
  -- SPO-AI-I / po-value-accountability
  --   was: Accountable for maximizing the value
  update public.concepts co
     set description = $d$The Product Owner answers for the product's value: a single accountable individual rather than a group, owning the ordering decisions that produce it.$d$
    from public.certifications c
   where c.id = co.certification_id
     and c.code = 'SPO-AI-I'
     and co.slug = 'po-value-accountability';
  get diagnostics k = row_count; n := n + k;
  if k <> 1 then
    raise exception 'concept row not matched'
      using detail = 'SPO-AI-I / po-value-accountability', hint = 'nothing is committed';
  end if;
  -- SM-AI-I / true-leadership
  --   was: Scrum Guide 2020 phrasing
  update public.concepts co
     set description = $d$The 2020 Guide's term for how a Scrum Master leads: influence earned by serving the team, not authority held over it.$d$
    from public.certifications c
   where c.id = co.certification_id
     and c.code = 'SM-AI-I'
     and co.slug = 'true-leadership';
  get diagnostics k = row_count; n := n + k;
  if k <> 1 then
    raise exception 'concept row not matched'
      using detail = 'SM-AI-I / true-leadership', hint = 'nothing is committed';
  end if;

  -- ===================== POST-CONDITIONS =====================

  if n <> 8 then
    raise exception 'expected 8 concept rows, updated %', n
      using hint = 'nothing is committed';
  end if;

  select count(*) into k from public.concepts co
    join public.certifications c on c.id = co.certification_id
   where c.code = 'SM-AI-I' and co.slug = 'sprint-goal'
     and co.description like '%Singular objective for the Sprint%';
  if k <> 0 then
    raise exception 'old wording survives'
      using detail = 'SM-AI-I / sprint-goal';
  end if;
  select count(*) into k from public.concepts co
    join public.certifications c on c.id = co.certification_id
   where c.code = 'SD-AI-I' and co.slug = 'sprint-goal'
     and co.description like '%The single objective for the Sprint.%';
  if k <> 0 then
    raise exception 'old wording survives'
      using detail = 'SD-AI-I / sprint-goal';
  end if;
  select count(*) into k from public.concepts co
    join public.certifications c on c.id = co.certification_id
   where c.code = 'SM-AI-I' and co.slug = 'product-backlog'
     and co.description like '%Emergent, ordered list%';
  if k <> 0 then
    raise exception 'old wording survives'
      using detail = 'SM-AI-I / product-backlog';
  end if;
  select count(*) into k from public.concepts co
    join public.certifications c on c.id = co.certification_id
   where c.code = 'SM-AI-I' and co.slug = 'team-size'
     and co.description like '%Typically 10 or fewer people.%';
  if k <> 0 then
    raise exception 'old wording survives'
      using detail = 'SM-AI-I / team-size';
  end if;
  select count(*) into k from public.concepts co
    join public.certifications c on c.id = co.certification_id
   where c.code = 'SM-AI-I' and co.slug = 'daily-scrum'
     and co.description like '%15-minute Developer-owned event%';
  if k <> 0 then
    raise exception 'old wording survives'
      using detail = 'SM-AI-I / daily-scrum';
  end if;
  select count(*) into k from public.concepts co
    join public.certifications c on c.id = co.certification_id
   where c.code = 'SM-AI-II' and co.slug = 'daily-scrum'
     and co.description like '%inspect progress toward the Sprint Goal and adapt%';
  if k <> 0 then
    raise exception 'old wording survives'
      using detail = 'SM-AI-II / daily-scrum';
  end if;
  select count(*) into k from public.concepts co
    join public.certifications c on c.id = co.certification_id
   where c.code = 'SPO-AI-I' and co.slug = 'po-value-accountability'
     and co.description like '%Accountable for maximizing the value%';
  if k <> 0 then
    raise exception 'old wording survives'
      using detail = 'SPO-AI-I / po-value-accountability';
  end if;
  select count(*) into k from public.concepts co
    join public.certifications c on c.id = co.certification_id
   where c.code = 'SM-AI-I' and co.slug = 'true-leadership'
     and co.description like '%Scrum Guide 2020 phrasing%';
  if k <> 0 then
    raise exception 'old wording survives'
      using detail = 'SM-AI-I / true-leadership';
  end if;

  -- THE NEGATIVE HALF. Named explicitly rather than trusted to the total.
  select co.description into untouched
    from public.concepts co
    join public.certifications c on c.id = co.certification_id
   where c.code = 'SD-AI-I' and co.slug = 'daily-scrum';

  if untouched is distinct from $u$The Developers' 15-minute inspect-and-adapt event.$u$ then
    raise exception 'a row that must not change was changed'
      using detail = 'SD-AI-I / daily-scrum', hint = 'nothing is committed';
  end if;

  raise notice '8 concept descriptions rewritten; SD-AI-I/daily-scrum untouched';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
--   select c.code, co.slug, co.description
--     from public.concepts co
--     join public.certifications c on c.id = co.certification_id
--    where co.slug in ('sprint-goal','product-backlog','team-size','daily-scrum',
--                      'po-value-accountability','true-leadership')
--    order by c.code, co.slug;
--
-- Expect nine rows: eight rewritten, and SD-AI-I/daily-scrum as it was.
--
-- The 2017-terminology pass (Development Team 113, self-organizing 78,
-- servant-leader 24) and the lesson quotation marking are SEPARATE and NOT in
-- this file. The MCP views stay at four certifications until both land.
