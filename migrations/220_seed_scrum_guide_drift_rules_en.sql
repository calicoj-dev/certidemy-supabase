-- 220_seed_scrum_guide_drift_rules_en.sql
--
-- Seeds the first authority sources, their citations, and the ENGLISH drift
-- ruleset for the 2017 -> 2020 Scrum Guide transition.
--
-- GROUNDING
--   Every rule below was checked against the actual text of BOTH editions,
--   fetched from scrumguides.org on 2026-08-17:
--     2020  https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf
--     2017  https://scrumguides.org/docs/scrumguide/v2017/2017-Scrum-Guide-US.pdf
--   No rule here was written from model training knowledge. Where a claim could
--   not be checked against a fetched edition, the rule was OMITTED (see below).
--
-- THE INVARIANT, RESTATED PRECISELY
--   superseded    - must not fire against its OWN authority source text.
--   non_canonical - must not fire against ANY registered edition.
--   All 12 rules below were verified against the 2020 text; the 4 non_canonical
--   rules were additionally verified against the 2017 text.
--
-- DELIBERATE OMISSION
--   'Product Backlog grooming' is NOT seeded. Neither 2017 nor 2020 uses it, so
--   it looks like a clean non_canonical rule, but it may have appeared in an
--   earlier edition. Asserting otherwise from training knowledge is the exact
--   failure mode this schema exists to prevent. Register the 2011 edition, run
--   the invariant, then add it.
--
-- LANGUAGE SCOPE
--   ENGLISH ONLY. es-419 and pt-BR rules require the official Spanish and
--   Portuguese editions, which are separate documents with their own wording.
--   Authoring them from the English text would violate the per-language rule.
--   They are a follow-on migration after those PDFs are fetched.
--
-- QUOTES ARE NULL BY DESIGN
--   The locator is the load-bearing evidence: "2020 Scrum Guide, Section: Scrum
--   Team" is a complete citation for a report. Quotes can be filled later from
--   the PDF if richer evidence is wanted; the column is nullable for this reason
--   and capped at 300 characters when used.
--
-- ASCII-only prose. Editor-first. Idempotent via fixed ids + on conflict.
--
-- Tip before this migration: 219. This is 220.


-- =====================================================================
-- SECTION 1 - authority_sources
-- content_hash is left NULL. It is set once the fixture text is on disk
-- and hashed; see the PowerShell in the session notes.
-- =====================================================================

insert into public.authority_sources
  (id, slug, title, publisher, edition, published_on, canonical_url, verified_as_of, notes)
values
  ('5c000000-0000-0000-0000-000000002020',
   'scrum-guide-2020',
   'The Scrum Guide: The Definitive Guide to Scrum',
   'Ken Schwaber and Jeff Sutherland',
   'November 2020',
   '2020-11-01',
   'https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf',
   '2026-08-17',
   'Current authoritative edition. CC BY-SA 4.0. Fetched and read in full on 2026-08-17.'),

  ('5c000000-0000-0000-0000-000000002017',
   'scrum-guide-2017',
   'The Scrum Guide: The Definitive Guide to Scrum',
   'Ken Schwaber and Jeff Sutherland',
   'November 2017',
   '2017-11-01',
   'https://scrumguides.org/docs/scrumguide/v2017/2017-Scrum-Guide-US.pdf',
   '2026-08-17',
   'Superseded edition. Registered so that superseded-class rules name a real from-end and so non_canonical rules can be tested against it.')
on conflict (id) do update set
  slug           = excluded.slug,
  title          = excluded.title,
  publisher      = excluded.publisher,
  edition        = excluded.edition,
  published_on   = excluded.published_on,
  canonical_url  = excluded.canonical_url,
  verified_as_of = excluded.verified_as_of,
  notes          = excluded.notes;


-- =====================================================================
-- SECTION 2 - certification_authorities
-- Attached to the three Scrum certifications. Codes are resolved by join;
-- no UUID is assumed beyond SM-AI-I, which was confirmed live.
-- =====================================================================

insert into public.certification_authorities
  (certification_id, authority_source_id, role, notes)
select c.id, v.src::uuid, v.role, v.notes
from (values
  ('SM-AI-I',  '5c000000-0000-0000-0000-000000002020', 'authoritative', 'Current truth for this certification.'),
  ('SM-AI-I',  '5c000000-0000-0000-0000-000000002017', 'superseded',    'Prior edition. Source of the drift ruleset legacy terms.'),
  ('SPO-AI-I', '5c000000-0000-0000-0000-000000002020', 'authoritative', 'Current truth for this certification.'),
  ('SPO-AI-I', '5c000000-0000-0000-0000-000000002017', 'superseded',    'Prior edition. Source of the drift ruleset legacy terms.'),
  ('SD-AI-I',  '5c000000-0000-0000-0000-000000002020', 'authoritative', 'Current truth for this certification.'),
  ('SD-AI-I',  '5c000000-0000-0000-0000-000000002017', 'superseded',    'Prior edition. Source of the drift ruleset legacy terms.')
) as v(code, src, role, notes)
join public.certifications c on c.code = v.code
on conflict (certification_id, authority_source_id) do update set
  role  = excluded.role,
  notes = excluded.notes;


-- =====================================================================
-- SECTION 3 - authority_citations (2020 edition, English)
-- Locators are the 2020 Scrum Guide's own section headings, taken from its
-- table of contents. Stable, human-checkable, and enough for a report line.
-- =====================================================================

insert into public.authority_citations
  (id, authority_source_id, locator, lang, quote)
values
  ('5c100000-0000-0000-0000-000000000001', '5c000000-0000-0000-0000-000000002020', 'Section: Scrum Team',      'en', null),
  ('5c100000-0000-0000-0000-000000000002', '5c000000-0000-0000-0000-000000002020', 'Section: Scrum Master',    'en', null),
  ('5c100000-0000-0000-0000-000000000003', '5c000000-0000-0000-0000-000000002020', 'Section: Daily Scrum',     'en', null),
  ('5c100000-0000-0000-0000-000000000004', '5c000000-0000-0000-0000-000000002020', 'Section: Sprint Planning', 'en', null),
  ('5c100000-0000-0000-0000-000000000005', '5c000000-0000-0000-0000-000000002020', 'Section: Increment',       'en', null),
  ('5c100000-0000-0000-0000-000000000006', '5c000000-0000-0000-0000-000000002020', 'Section: Product Backlog', 'en', null)
on conflict (id) do update set
  authority_source_id = excluded.authority_source_id,
  locator             = excluded.locator,
  lang                = excluded.lang;


-- =====================================================================
-- SECTION 4 - drift_rules (English)
--
-- Column order: id, class, authority, superseded, lang, legacy_term,
--               current_term, match_mode, pattern, severity, citation,
--               rationale
--
-- Every regex was written to avoid matching the 2020 text. Where a plain
-- phrase would be ambiguous in ordinary English (notably 'roles'), the
-- pattern is deliberately narrowed rather than the severity lowered, because
-- a false positive costs more trust than a missed low-severity finding.
-- =====================================================================

insert into public.drift_rules
  (id, rule_class, authority_source_id, superseded_source_id, lang,
   legacy_term, current_term, match_mode, pattern, severity,
   authority_citation_id, rationale)
values

-- ---- superseded: real 2017 -> 2020 transitions -----------------------

('5c200000-0000-0000-0000-000000000001', 'superseded',
 '5c000000-0000-0000-0000-000000002020', '5c000000-0000-0000-0000-000000002017', 'en',
 'Development Team', 'Developers', 'phrase', null, 'high',
 '5c100000-0000-0000-0000-000000000001',
 'The 2017 edition names the Development Team as one of three roles. The 2020 edition removes the sub-team entirely: the Scrum Team consists of one Scrum Master, one Product Owner, and Developers. This is a change of object model, not of vocabulary.'),

('5c200000-0000-0000-0000-000000000002', 'superseded',
 '5c000000-0000-0000-0000-000000002020', '5c000000-0000-0000-0000-000000002017', 'en',
 'self-organizing', 'self-managing', 'regex', 'self[- ]?organi[sz](ing|ation|e|ed)', 'high',
 '5c100000-0000-0000-0000-000000000001',
 'The 2017 edition describes Scrum Teams as self-organizing. The 2020 edition describes them as self-managing, meaning they internally decide who does what, when, and how. Broader scope, not a synonym.'),

('5c200000-0000-0000-0000-000000000003', 'superseded',
 '5c000000-0000-0000-0000-000000002020', '5c000000-0000-0000-0000-000000002017', 'en',
 'servant-leader', 'true leader who serves', 'regex', 'servant[- ]?leader', 'high',
 '5c100000-0000-0000-0000-000000000002',
 'The 2017 edition calls the Scrum Master a servant-leader. The 2020 edition states that Scrum Masters are true leaders who serve. The framing moved from service posture to accountable leadership.'),

('5c200000-0000-0000-0000-000000000004', 'superseded',
 '5c000000-0000-0000-0000-000000002020', '5c000000-0000-0000-0000-000000002017', 'en',
 'potentially releasable', 'usable Increment', 'phrase', null, 'medium',
 '5c100000-0000-0000-0000-000000000005',
 'The 2017 edition requires a potentially releasable Increment. The 2020 edition requires the Increment to be usable, and allows multiple Increments within a Sprint with delivery permitted before the Sprint ends.'),

('5c200000-0000-0000-0000-000000000005', 'superseded',
 '5c000000-0000-0000-0000-000000002020', '5c000000-0000-0000-0000-000000002017', 'en',
 'Scrum roles', 'accountabilities', 'regex',
 '(three roles|3 roles|Scrum roles|roles, events, artifacts)', 'medium',
 '5c100000-0000-0000-0000-000000000001',
 'The 2017 edition defines Scrum as roles, events, artifacts and rules. The 2020 edition defines three accountabilities within one Scrum Team. Pattern is narrowed to avoid flagging ordinary English use of the word role.'),

('5c200000-0000-0000-0000-000000000006', 'superseded',
 '5c000000-0000-0000-0000-000000002020', '5c000000-0000-0000-0000-000000002017', 'en',
 'Development Team size three to nine', 'typically 10 or fewer people', 'regex',
 '(three to nine|3 to 9|3-9|nine members|9 members)', 'medium',
 '5c100000-0000-0000-0000-000000000001',
 'The 2017 edition sets Development Team size between three and nine, excluding the Product Owner and Scrum Master. The 2020 edition states the whole Scrum Team is typically 10 or fewer people, counting everyone.'),

('5c200000-0000-0000-0000-000000000007', 'superseded',
 '5c000000-0000-0000-0000-000000002020', '5c000000-0000-0000-0000-000000002017', 'en',
 'time-box', 'timebox', 'regex', 'time[- ]box', 'low',
 '5c100000-0000-0000-0000-000000000004',
 'Orthographic change only. The 2017 edition hyphenates time-box and time-boxed; the 2020 edition writes timebox and timeboxed. Low severity: it dates a document without indicating a wrong model.'),

('5c200000-0000-0000-0000-000000000008', 'superseded',
 '5c000000-0000-0000-0000-000000002020', '5c000000-0000-0000-0000-000000002017', 'en',
 'Sprint Planning meeting', 'Sprint Planning', 'phrase', null, 'low',
 '5c100000-0000-0000-0000-000000000004',
 'The 2017 edition refers to the Sprint Planning meeting. The 2020 edition names the event without the word meeting throughout.'),

-- ---- non_canonical: terms in no registered edition -------------------

('5c200000-0000-0000-0000-000000000009', 'non_canonical',
 '5c000000-0000-0000-0000-000000002020', null, 'en',
 'Daily Sprint', 'Daily Scrum', 'phrase', null, 'high',
 '5c100000-0000-0000-0000-000000000003',
 'Not a term in the 2017 or 2020 editions. Observed in a live competitor syllabus during calibration. A fabricated event name is a stronger integrity signal than a stale one, because it cannot be explained by edition lag.'),

('5c200000-0000-0000-0000-000000000010', 'non_canonical',
 '5c000000-0000-0000-0000-000000002020', null, 'en',
 'Daily Standup', 'Daily Scrum', 'regex', 'daily[- ]?stand[- ]?up', 'medium',
 '5c100000-0000-0000-0000-000000000003',
 'General agile vocabulary, not Scrum Guide vocabulary in either registered edition. Indicates material assembled from mixed agile sources rather than from the Guide.'),

('5c200000-0000-0000-0000-000000000011', 'non_canonical',
 '5c000000-0000-0000-0000-000000002020', null, 'en',
 'Sprint Zero', null, 'regex', 'sprint[- ]?(zero|0)\M', 'low',
 '5c100000-0000-0000-0000-000000000004',
 'Not defined in either registered edition. Deliberately has no current_term: there is no Scrum event it maps to, which is the point of the finding.'),

('5c200000-0000-0000-0000-000000000012', 'non_canonical',
 '5c000000-0000-0000-0000-000000002020', null, 'en',
 'ScrumMaster', 'Scrum Master', 'regex', '\mScrumMaster\M', 'low',
 '5c100000-0000-0000-0000-000000000002',
 'Both registered editions write Scrum Master as two words. The single-word styling originates elsewhere and indicates material derived from a different body.')

on conflict (id) do update set
  rule_class            = excluded.rule_class,
  authority_source_id   = excluded.authority_source_id,
  superseded_source_id  = excluded.superseded_source_id,
  lang                  = excluded.lang,
  legacy_term           = excluded.legacy_term,
  current_term          = excluded.current_term,
  match_mode            = excluded.match_mode,
  pattern               = excluded.pattern,
  severity              = excluded.severity,
  authority_citation_id = excluded.authority_citation_id,
  rationale             = excluded.rationale;


-- =====================================================================
-- SECTION 5 - drift_rule_certifications
-- All twelve rules apply to all three Scrum certifications.
-- task_id is left NULL: mapping each rule to a specific task code is a
-- separate judgment pass and an unmapped rule still produces a finding.
-- =====================================================================

insert into public.drift_rule_certifications (drift_rule_id, certification_id)
select r.id, c.id
from public.drift_rules r
cross join public.certifications c
where r.authority_source_id = '5c000000-0000-0000-0000-000000002020'
  and r.lang = 'en'
  and c.code in ('SM-AI-I', 'SPO-AI-I', 'SD-AI-I')
on conflict (drift_rule_id, certification_id) do nothing;


-- =====================================================================
-- VERIFICATION - run these ONE AT A TIME.
-- =====================================================================

-- 1) two sources, six citations, twelve rules
-- select
--   (select count(*) from public.authority_sources)   as sources,
--   (select count(*) from public.authority_citations) as citations,
--   (select count(*) from public.drift_rules)         as rules;

-- 2) rule classes split 8 superseded / 4 non_canonical
-- select rule_class, count(*) from public.drift_rules group by rule_class order by rule_class;

-- 3) applicability: 36 rows (12 rules x 3 certifications)
-- select c.code, count(*) as rules
--   from public.drift_rule_certifications drc
--   join public.certifications c on c.id = drc.certification_id
--  group by c.code order by c.code;

-- 4) every regex compiles and matches its own legacy_term
--    (expect matches = true on every row; a false means the pattern is broken)
-- select legacy_term, match_mode, pattern,
--        case when match_mode = 'phrase' then true
--             else legacy_term ~* pattern end as self_match
--   from public.drift_rules order by legacy_term;

-- 5) THE SELF-FIRE SMOKE TEST against a phrase lifted from the 2020 text.
--    Expect ZERO rows. Any row is a broken rule.
-- with sample(txt) as (values
--   ('The Scrum Team consists of one Scrum Master, one Product Owner, and Developers. '
--    'They are also self-managing, meaning they internally decide who does what, when, and how. '
--    'Scrum Masters are true leaders who serve the Scrum Team and the larger organization. '
--    'Sprint Planning is timeboxed to a maximum of eight hours for a one-month Sprint. '
--    'The Daily Scrum is a 15-minute event for the Developers of the Scrum Team. '
--    'In order to provide value, the Increment must be usable.')
-- )
-- select r.legacy_term, r.severity
--   from public.drift_rules r, sample s
--  where (r.match_mode = 'phrase' and s.txt ilike '%' || r.legacy_term || '%')
--     or (r.match_mode = 'regex'  and s.txt ~* r.pattern);
