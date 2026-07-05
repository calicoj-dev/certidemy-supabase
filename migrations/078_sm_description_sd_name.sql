-- Migration 078: rewrite SM-AI-I description to house register + drop SD name prefix
--
-- (1) SM-AI-I's description was a pre-AI-era placeholder ("Foundational Scrum
--     Master certification covering the Scrum framework, roles, events, and
--     artifacts." -- with embedded raw newlines and trailing whitespace). It did
--     not mention AI at all, on the flagship AI-era cert, and read a full tier
--     below SPO-AI-I / SD-AI-I, which follow a house formula:
--     "AI-ready [role] certification. Validates [the craft] -- [scope], and the
--      signature discipline of [X]. Grounded in the 2020 Scrum Guide."
--     The rewrite follows that formula. Its claims are grounded in the scheme:
--     AI competencies are tested in EVERY domain (Module-6 dissolved and re-homed
--     into D1-D5, all exam-scope, migration 052; SCHEME-SM-AI-I s4). No exam
--     numbers in prose (they live in the stats row and would go stale).
--
-- (2) SD-AI-I's name still carried the "Certidemy " prefix while SM/SPO dropped
--     it (tracked backlog). Publicly visible since migration 077 put SD in the
--     catalog, so it is now a live marketing inconsistency, fixed here.

update public.certifications
set description = 'AI-ready Scrum Master certification. Validates the craft of making Scrum work in AI-augmented teams — the framework, accountabilities, events, and artifacts, and the signature discipline of facilitating a team where AI is a teammate: coaching healthy human–AI collaboration, protecting empiricism and focus, and clearing the new impediments AI-era delivery creates. AI competence is tested in every domain. Grounded in the 2020 Scrum Guide.'
where code = 'SM-AI-I';

update public.certifications
set name = 'Scrum Developer I — AI'
where code = 'SD-AI-I' and name like 'Certidemy %';

-- verify both in one read
select code, name, left(description, 90) as description_start
from public.certifications
where code in ('SM-AI-I','SPO-AI-I','SD-AI-I')
order by code;
