-- 221_widen_scrum_roles_drift_rule.sql
--
-- Calibration correction to drift rule 5 (Scrum roles -> accountabilities),
-- from the first full run of the engine against the six-document corpus.
--
-- WHAT WAS WRONG
--   The pattern required the literal string "three roles", so it missed the
--   CSM blog's "three primary roles" -- one of the six drift flags that
--   document was hand-scored for. Too narrow for prose while already firing
--   correctly on syllabus tables.
--
-- THE CHANGE
--   before: (three roles|3 roles|Scrum roles|roles, events, artifacts)
--   after:  ((three|3)( \w+)? roles|Scrum roles|roles, events, artifacts)
--
--   One optional word between the count and "roles". Deliberately ONE, not
--   \w+ repeated: "three of the many roles" must not match, because at that
--   distance the words are no longer a terminology claim.
--
-- VERIFIED BEFORE WRITING (12 cases, 0 failures):
--   MATCH    three primary roles / three roles / 3 roles / live Scrum roles /
--            Scrum roles / roles, events, artifacts / the three main roles
--   NO MATCH three of the many roles / the role of the Scrum Master /
--            This role manages the Product Backlog /
--            "Scrum defines three specific accountabilities within the Scrum
--            Team" and "The Scrum Team consists of one Scrum Master, one
--            Product Owner, and Developers" (both 2020 Scrum Guide text)
--
--   The 2020 Scrum Guide contains no occurrence of the word "role" at all, so
--   the no-self-fire invariant holds by construction.
--
-- WHAT IS NOT CHANGED, AND WHY
--   Rule 8 (Sprint Planning meeting) stays exactly as authored. It fired on the
--   TUV SUD guide, which was hand-scored as zero drift -- but the document
--   carries "Sprint Planning meeting", "Sprint Review meeting" and "Sprint
--   Retrospective meeting" as literal rows in its own weighting table, and
--   "enable participants to live Scrum roles" in its qualification criteria.
--   Both are 2017 vocabulary, read from the actual PDF.
--
--   THE HAND SCORE IS THE THING THAT WAS WRONG, NOT THE RULES. Tuning a rule
--   until it agrees with an estimate is how a detector becomes decorative. The
--   TUV calibration entry should be recorded as 2 low/medium residues rather
--   than zero drift, and that is a sharper finding than a clean pass: the most
--   rigorous competitor in the corpus still carries two traces of the 2017
--   edition.
--
-- ASCII-only. Editor-first. Idempotent.
--
-- Tip before this migration: 220. This is 221.


update public.drift_rules
set pattern    = '((three|3)( \w+)? roles|Scrum roles|roles, events, artifacts)',
    rationale  = 'The 2017 edition defines Scrum as roles, events, artifacts and rules. '
                 'The 2020 edition defines three accountabilities within one Scrum Team. '
                 'Pattern allows one optional word between the count and "roles" so that '
                 '"three primary roles" is caught, and no more than one, so that "three of '
                 'the many roles" is not. Narrow by design: "role" in ordinary English is '
                 'not a terminology claim, and flagging a correct document on it costs more '
                 'trust than a missed low-severity finding earns.',
    updated_at = now()
where id = '5c200000-0000-0000-0000-000000000005';


-- =====================================================================
-- VERIFICATION - run these ONE AT A TIME.
-- =====================================================================

-- 1) exactly one row changed, and it reads back correctly
-- select legacy_term, pattern, severity
--   from public.drift_rules
--  where id = '5c200000-0000-0000-0000-000000000005';

-- 2) self-match still holds for every regex rule (expect 12 rows, all true)
-- select legacy_term, match_mode, pattern,
--        case when match_mode = 'phrase' then true
--             else legacy_term ~* pattern end as self_match
--   from public.drift_rules order by legacy_term;

-- 3) POSITIVE test - the string the widening exists for (expect 1 row)
-- select legacy_term
--   from public.drift_rules
--  where match_mode = 'regex'
--    and 'Scrum teams operate with three primary roles' ~* pattern;

-- 4) NEGATIVE test - ordinary English must not fire (expect ZERO rows)
-- select legacy_term
--   from public.drift_rules
--  where match_mode = 'regex'
--    and 'This role manages the Product Backlog, prioritizing features' ~* pattern;

-- 5) THE INVARIANT - no rule fires against 2020 Scrum Guide text.
--    Expect ZERO rows.
-- with sample(txt) as (values
--   ('The Scrum Team consists of one Scrum Master, one Product Owner, and Developers. '
--    'Scrum defines three specific accountabilities within the Scrum Team: the Developers, '
--    'the Product Owner, and the Scrum Master. They are also self-managing, meaning they '
--    'internally decide who does what, when, and how. Scrum Masters are true leaders who '
--    'serve the Scrum Team and the larger organization. Sprint Planning is timeboxed to a '
--    'maximum of eight hours for a one-month Sprint. The Daily Scrum is a 15-minute event '
--    'for the Developers of the Scrum Team. In order to provide value, the Increment must '
--    'be usable.')
-- )
-- select r.legacy_term, r.severity
--   from public.drift_rules r, sample s
--  where r.is_active
--    and ((r.match_mode = 'phrase' and s.txt ilike '%' || r.legacy_term || '%')
--      or (r.match_mode = 'regex'  and s.txt ~* r.pattern));
