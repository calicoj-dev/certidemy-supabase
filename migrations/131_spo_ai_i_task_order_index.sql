-- 131_spo_ai_i_task_order_index.sql
--
-- Fix the blueprint display order for two SPO-AI-I tasks that sort FIRST in
-- their domain instead of last.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-clean. Idempotent (each UPDATE is guarded on the value being replaced).
--
-- ===========================================================================
-- THE FINDING
-- ===========================================================================
-- tasks.order_index is GLOBAL across a certification (SPO-AI-I runs 1..44), not
-- per-domain. What matters is therefore not the absolute value but whether a
-- task sorts correctly WITHIN its own domain.
--
-- Two tasks were added to SPO-AI-I after the original scaffold - 3.9 by
-- migration 094 (the 1_remember task carrying the one-Product-Owner rule, split
-- out when 3.2 was raised to 3_apply) and 5.12 (the diagnostic capstone). Both
-- were given an order_index matching their task NUMBER rather than a value
-- continuing their domain's existing sequence:
--
--     D3 holds 3.1..3.7 at 15..21, and 3.9 at 9   -> 3.9 displays FIRST
--     D5 holds 5.1..5.11 at 34..44, and 5.12 at 12 -> 5.12 displays FIRST
--
-- So a candidate reading the published blueprint sees D3 open with "Recall that
-- the Product Owner is one accountable person" before the domain's own opening
-- task, and D5 open with its diagnostic capstone. The exam is unaffected -
-- generate-mock-exam allocates by domain weight and spreads across tasks, and
-- never reads order_index - but the blueprint is a published artifact and it
-- reads as disordered.
--
-- Checked platform-wide with a window-function comparison of rank-by-index
-- against rank-by-task-code: SPO-AI-I D3 and D5 are the ONLY two domains in any
-- of the six certs where the two disagree. The other late-added tasks
-- (AIGRM-I 1.9/1.10, SD-AI-I 1.9, SM-AI-I 4.13/4.14) were all numbered
-- correctly and sort as expected.
--
-- ===========================================================================
-- THE FIX
-- ===========================================================================
-- Move each task to the end of its own domain's run rather than resequencing
-- the cert. Global values need not be contiguous - only correctly ordered
-- within a domain - so this touches two rows and leaves 44 alone.
--
--     3.9   9 -> 22   (D3 ends at 21; 22 is free because D4 starts at 22...)
--
-- CAREFUL: D4 already occupies 22..33. Using 22 would tie 3.9 with 4.1. Ties
-- are resolved arbitrarily and the bug would reappear in a different form. The
-- values below are therefore taken from ABOVE the current maximum (44), which
-- is guaranteed free:
--
--     3.9   9 -> 45
--     5.12 12 -> 46
--
-- 3.9 at 45 still sorts last within D3 because D3's other members are 15..21,
-- and domain grouping happens before task ordering in every consumer
-- (get-certification-blueprint, the dump query, verify-cert).
--
-- ---------------------------------------------------------------------------
-- BEFORE: expect 3.9 = 9 and 5.12 = 12.
--
-- select d.code as domain, t.code as task, t.order_index
--   from public.tasks t
--   join public.domains d on d.id = t.domain_id
--  where t.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
--    and t.code in ('3.9','5.12')
--  order by d.order_index, t.order_index;
-- ---------------------------------------------------------------------------


update public.tasks
   set order_index = 45
 where certification_id = (select id from public.certifications where code = 'SPO-AI-I')
   and code = '3.9' and order_index = 9;

update public.tasks
   set order_index = 46
 where certification_id = (select id from public.certifications where code = 'SPO-AI-I')
   and code = '5.12' and order_index = 12;


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) THE test: display order must equal task-code order in every domain of
--     every cert. Expect ZERO rows.
--
-- with parsed as (
--   select c.code as cert, d.code as domain, d.order_index as dom_idx,
--          t.code as task, t.order_index,
--          split_part(t.code,'.',1)::int as major,
--          split_part(t.code,'.',2)::int as minor
--     from public.tasks t
--     join public.domains d on d.id = t.domain_id
--     join public.certifications c on c.id = t.certification_id
-- ),
-- ranked as (
--   select *,
--     row_number() over (partition by cert, domain order by order_index)  as rank_by_index,
--     row_number() over (partition by cert, domain order by major, minor) as rank_by_code
--   from parsed
-- )
-- select cert, domain, task, order_index, rank_by_index, rank_by_code
--   from ranked
--  where rank_by_index <> rank_by_code
--  order by cert, dom_idx, order_index;
--
-- (b) no two tasks in the same cert share an order_index. Expect zero rows.
--
-- select c.code, t.order_index, count(*)
--   from public.tasks t
--   join public.certifications c on c.id = t.certification_id
--  group by c.code, t.order_index
-- having count(*) > 1;
--
-- (c) eyeball SPO-AI-I D3 and D5 in display order - 3.9 last in D3, 5.12 last in D5.
--
-- select d.code as domain, t.code as task, t.order_index
--   from public.tasks t
--   join public.domains d on d.id = t.domain_id
--  where t.certification_id = (select id from public.certifications where code = 'SPO-AI-I')
--    and d.code in ('D3','D5')
--  order by d.order_index, t.order_index;
--
-- (d) the gate still passes: node scripts\verify-cert.mjs --cert SPO-AI-I
-- ---------------------------------------------------------------------------
