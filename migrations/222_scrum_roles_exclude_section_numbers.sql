-- 222_scrum_roles_exclude_section_numbers.sql
--
-- Corrects a regression introduced by migration 221.
--
-- WHAT 221 DID, AND WHAT IT ACTUALLY ACHIEVED
--
--   221 widened rule 5 from "three roles" to "(three|3)( \w+)? roles" so that
--   the CSM blog's "three primary roles" would be caught -- one of the six
--   drift flags that document was hand-scored for.
--
--   IT DID NOT DO THAT. The CSM blog stayed at 3 drift findings, because
--   "Scrum roles" was ALREADY firing there via its "Scrum Roles in the CSM
--   Course" heading, not via the count. 221 was written against an assumed
--   match mechanism rather than an inspected one.
--
--   Its only measurable effect was on the BCS EXIN syllabus, which went from
--   4 drift findings to 5. Inspecting the matched span:
--
--       "2.3 Other roles (Product Owner, Development Team)"
--        ^^^ matched span was "3 Other roles"
--
--   The "3" is a SECTION NUMBER, not a count.
--
-- WHY THIS MATTERS EVEN THOUGH THE VERDICT WAS DEFENSIBLE
--
--   BCS genuinely does say "Other roles (Product Owner, Development Team)",
--   which is 2017 vocabulary, so a roles finding on that document is not wrong.
--   But the evidence excerpt a partner sees would read "2.3 Other roles", and
--   evidence that looks like a parsing bug discredits a correct verdict.
--
--   For a tool whose entire pitch is auditability, a right answer on wrong
--   evidence is not good enough. BCS's real signal is already caught by rule 1
--   (Development Team, high severity); rule 5 was adding a duplicate verdict on
--   bad evidence, so losing it costs nothing.
--
-- THE CHANGE
--   before: ((three|3)( \w+)? roles|Scrum roles|roles, events, artifacts)
--   after:  (((three)|(?<![.0-9])3)( \w+)? roles|Scrum roles|roles, events, artifacts)
--
--   A negative lookbehind on the bare numeral only. The spelled-out "three" is
--   unaffected, because no section-numbering scheme spells its numbers.
--
--   Postgres lookbehind support confirmed live before writing this, not assumed:
--     '2.3 Other roles (Product Owner, Development Team)' ~* <new> -> false
--     'Scrum teams operate with three primary roles'      ~* <new> -> true
--
-- VERIFIED BEFORE WRITING (12 cases, 0 failures):
--   MATCH    three primary roles / three roles / 3 roles / covers 3 main roles /
--            live Scrum roles / Scrum roles / roles, events, artifacts
--   NO MATCH 2.3 Other roles (Product Owner, Development Team) /
--            1.3 Agile roles overview /
--            2.3.1 Explain all roles within the Scrum framework /
--            the role of the Scrum Master /
--            "Scrum defines three specific accountabilities within the Scrum Team"
--
-- EXPECTED EFFECT ON THE CALIBRATION CORPUS
--   BCS EXIN      5 -> 4 drift findings
--   everything else unchanged (TUV SUD and scrummanager match on "Scrum roles";
--   the CSM blog matches on its heading; AulaUtil and AgilePlaza unaffected)
--
-- THE LESSON, RECORDED BECAUSE IT IS THE THIRD VARIANT OF IT IN ONE SESSION
--
--   A COUNT IS NOT EVIDENCE. verify-cert passing at 29/0 did not mean the item
--   bank was clean. A drift rule firing did not mean the item was wrong -- all
--   19 servant-leader hits were correct content. And a drift count moving 4 -> 5
--   did not mean the rule improved. Only reading the matched span settles it.
--
-- ASCII-only. Editor-first. Idempotent.
--
-- Tip before this migration: 221. This is 222.


update public.drift_rules
set pattern    = '(((three)|(?<![.0-9])3)( \w+)? roles|Scrum roles|roles, events, artifacts)',
    rationale  = 'The 2017 edition defines Scrum as roles, events, artifacts and rules. '
                 'The 2020 edition defines three accountabilities within one Scrum Team. '
                 'One optional word is allowed between the count and "roles" so that '
                 '"three primary roles" is caught and "three of the many roles" is not. '
                 'The bare numeral carries a negative lookbehind on [.0-9] so that a '
                 'section number such as "2.3 Other roles" cannot masquerade as a count: '
                 'the verdict would often still be defensible, but evidence that looks '
                 'like a parsing bug discredits a correct finding. Narrow by design -- '
                 '"role" in ordinary English is not a terminology claim.',
    updated_at = now()
where id = '5c200000-0000-0000-0000-000000000005';


-- =====================================================================
-- VERIFICATION - run these ONE AT A TIME.
-- =====================================================================

-- 1) the rule reads back with the new pattern
-- select legacy_term, pattern, severity
--   from public.drift_rules
--  where id = '5c200000-0000-0000-0000-000000000005';

-- 2) self-match holds for every regex rule (expect 12 rows, all true)
-- select legacy_term, match_mode, pattern,
--        case when match_mode = 'phrase' then true
--             else legacy_term ~* pattern end as self_match
--   from public.drift_rules order by legacy_term;

-- 3) THE REGRESSION IS CLOSED - section number must not fire (expect ZERO rows)
-- select legacy_term
--   from public.drift_rules
--  where match_mode = 'regex'
--    and '2.3 Other roles (Product Owner, Development Team)' ~* pattern;

-- 4) the real count still fires (expect 1 row: Scrum roles)
-- select legacy_term
--   from public.drift_rules
--  where match_mode = 'regex'
--    and 'Scrum teams operate with three primary roles' ~* pattern;

-- 5) THE INVARIANT - no rule fires against 2020 Scrum Guide text (expect ZERO)
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
