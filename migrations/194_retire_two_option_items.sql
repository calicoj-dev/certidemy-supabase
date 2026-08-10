-- 194_retire_two_option_items.sql
--
-- SEVEN LIVE CERTS CARRY ITEMS A GUESSER PASSES.
--
-- 76 question groups (228 rows across three languages) hold exactly two
-- options. A candidate who knows nothing scores 50 percent on each. Some are
-- bare "True | False" with no explanatory text at all - the options carry no
-- information and a coin decides the mark.
--
--     SM-AI-I    11 secure + 11 practice
--     SD-AI-I    11 secure +  6 practice
--     SPO-AI-I    8 secure +  4 practice
--     AIHR-I      5 secure +  1 practice
--     ISMS-F      3 secure +  4 practice
--     AIE-I       2 secure +  4 practice
--     AISM-I      2 secure +  4 practice
--
-- For a candidate sitting an 80-item form drawn from a bank with eleven such
-- items, a meaningful share of the exam is decided by chance rather than by
-- competence. That is a validity problem, not a tidiness problem.
--
-- WHY NOTHING CAUGHT IT. No minimum option count existed anywhere.
-- LESSON_AUTHORING_SPEC never stated one (fixed, eb8fdec) and verify-cert never
-- checked one. Worse, the answer-position guard filters to items with three or
-- more options - so the items most vulnerable to position cueing are precisely
-- the ones that check cannot see. All seven certs report ALL INVARIANTS HOLD.
--
-- AIMS-F had three such items; rewritten in place by 193 because nothing there
-- had ever been answered.
--
-- WHY RETIRE RATHER THAN REWRITE. 8 attempts exist across 6 of these items in
-- AIE-I, AIHR-I and SM-AI-I. Migration 089 draws the line precisely: once an
-- item has been presented to a candidate it is never deleted and never silently
-- rewritten, because the response history is the examination record ISO/IEC
-- 17024 requires. The rows stay; the generators backfill replacements, which
-- they do automatically because retired items are excluded from stock counts.
--
-- PREREQUISITE, ALREADY LANDED. Retirement was half-implemented: 089 declared
-- that retiring removes an item from circulation, but neither serving path
-- checked retired_at. generate-mock-exam filtered status only;
-- fetchConceptPractice filtered neither. Fixed and deployed first (f6dee5e,
-- 1bcbb56) - this migration is the event that would otherwise have made both
-- gaps live at once. status is set to 'rejected' as well, belt and braces.
--
-- EDITOR NOTE: the Supabase SQL editor runs each statement on its own
-- connection, so no temp table survives between statements. The group list is
-- inline in both statements. Run statement 1 first; it must return 76/76/76.

-- ============================================================================
-- 1. GUARD. Run alone. All three numbers must be 76.
--    listed  = groups named below
--    actual  = groups in the database with fewer than four options
--    matched = the intersection
--    Any mismatch means the list is stale. Do not run statement 2.
-- ============================================================================

with listed(question_group_id) as (values
    ('92d4344f-195e-4c44-a689-d3751e8817f2'::uuid),
    ('b0f73a33-ac73-48f4-9886-e4501c031830'::uuid),
    ('ef4b1a6a-075b-4985-bdef-763c2879abc8'::uuid),
    ('fbe99e0d-24b7-4472-a12c-377e3d31e828'::uuid),
    ('0d87f390-67d2-4662-b8ab-90011cc08a64'::uuid),
    ('c4eba722-49c9-42aa-94ce-6139f6d1a5f2'::uuid),
    ('036e06cf-4f31-484d-a4e3-981b8d4c50da'::uuid),
    ('2f69a943-df09-4aad-9922-251042147717'::uuid),
    ('39099075-0d5b-4c42-bd53-a1bb861a6977'::uuid),
    ('460ffb46-20ea-48c0-ae92-e732b430a3fc'::uuid),
    ('eba63864-8a9a-4c65-bd30-fab360ed8b31'::uuid),
    ('ed79047e-7c3f-4c64-a35c-21734fbf6768'::uuid),
    ('21ce9052-dc9b-498e-8e64-003e538a4374'::uuid),
    ('2dd2a6ee-52d1-4d7c-96bd-998452822ad0'::uuid),
    ('b5a490dd-52ed-407b-af1d-cb87d098687a'::uuid),
    ('ca2015ba-b6c2-45a1-92bd-cec9a8cb5a26'::uuid),
    ('8602fb2c-a909-40b2-8486-2c828e17bf4b'::uuid),
    ('fd5dd074-cb4f-465a-a775-a1128ce0d131'::uuid),
    ('4c4c9c87-18ef-4a65-80c3-19ca0753468e'::uuid),
    ('4c75fab8-b6ff-47c8-b804-05db70ceba88'::uuid),
    ('86e4f204-dae6-4c59-b348-29cd748a3f92'::uuid),
    ('a8fed1f5-bea8-4f50-bdcd-272ff3498ecf'::uuid),
    ('7987b453-a887-45e6-86d3-ef6261e114a9'::uuid),
    ('9c2cc5b4-19b9-475a-b810-18407af757eb'::uuid),
    ('b9a6f7f4-9f2c-462d-8904-2db521de08ca'::uuid),
    ('1ab939a2-9876-4981-b3ed-7605d0476a38'::uuid),
    ('2ffe6943-cff1-41a8-a5ae-fd399a55f315'::uuid),
    ('48a319a2-0c6f-42d4-8980-e20e3edb78aa'::uuid),
    ('5fe90e7f-c6b9-49be-bcca-f4ffaec7b5ac'::uuid),
    ('9a795eda-3015-482b-b53f-3e36c5fea47e'::uuid),
    ('c49e0105-03b3-4565-92f3-f3087565b5a7'::uuid),
    ('0d5dca42-e757-4a94-900d-49f6d0e49c1a'::uuid),
    ('218b3e7a-9a46-4208-9041-63e81610d631'::uuid),
    ('2e2e8364-eb32-4f5b-80cb-61f803d1dfd8'::uuid),
    ('398ad506-41e6-4b7e-be8c-6d3182b5d143'::uuid),
    ('4f415752-c7f7-42ce-9608-d40ea5b571fa'::uuid),
    ('5cbc3726-e762-49f4-a7b9-18f270aa8085'::uuid),
    ('6e3519f0-d545-4fe3-a262-445614b1ab04'::uuid),
    ('8119cc19-4a98-4d9a-8e02-1294caa3f533'::uuid),
    ('98062d93-4f04-44f4-bd4e-c8d3f4a2f31e'::uuid),
    ('a3e3134f-2f35-4f6c-83b2-1f9d6f3588dd'::uuid),
    ('d6cd730d-b282-4893-9a46-3daa8a8f5d8a'::uuid),
    ('22c4f784-df81-4e91-ae8a-bf58e5e1753f'::uuid),
    ('6dd576c3-617e-4771-97ae-c0157d0e0239'::uuid),
    ('84e4cd2f-46c3-4a40-b9fc-5be795b47df1'::uuid),
    ('86ba2015-b13e-4fa8-a8b0-344f82a9dabd'::uuid),
    ('92c98f6b-8075-49c9-b823-7216f9892e5e'::uuid),
    ('955b4708-473f-4243-88ae-1a0eef59cb1a'::uuid),
    ('a25deabc-9ac3-4674-8a36-78f67367ac35'::uuid),
    ('a960f9fd-feef-4cb9-8815-bb3d0f6a6857'::uuid),
    ('ac6778c5-2559-4a38-8a45-b1f15b3ec82b'::uuid),
    ('d38ad4d7-5f40-4b44-99da-e1a82b5342e4'::uuid),
    ('f1282277-30b2-4bac-afd4-092598c78aeb'::uuid),
    ('36e68523-c626-4951-aa61-4c038a6d2e30'::uuid),
    ('4194556a-41d4-4897-8879-d5e1d51a3a84'::uuid),
    ('455e2c03-417f-4e6c-84f6-e99106198256'::uuid),
    ('4d132428-8dc6-49b2-9a1d-a645f354f352'::uuid),
    ('5ba440fe-340e-4e09-bb50-122e482983d6'::uuid),
    ('864155fc-ad45-4654-a195-63ce4bff6690'::uuid),
    ('98ebc308-d300-4901-b81b-a5dbe98a5939'::uuid),
    ('ac6b200e-f503-4995-b55d-113842003b68'::uuid),
    ('d05365ea-3463-4f4a-ba40-33a3374c9696'::uuid),
    ('d2bbb96e-2604-4076-84c6-5ea06e468308'::uuid),
    ('dd98e71c-aab5-485c-8005-75e47a749a19'::uuid),
    ('2058b3c8-5288-4d19-a9c7-6e31efe69a6c'::uuid),
    ('35cc32fd-ecc6-49e9-8638-b9ee8d138474'::uuid),
    ('69517866-cde6-4e4e-a1a6-45680ead86d8'::uuid),
    ('95d2cdb1-817e-4d33-a575-e45df6592435'::uuid),
    ('0da03243-7ae4-4b31-80d4-57eab965c5bf'::uuid),
    ('34ff481d-fcbd-4c66-8107-1ad2470c959e'::uuid),
    ('38088e00-19a6-445a-9f42-c8c70354f40a'::uuid),
    ('712aa64f-7211-4cce-8458-0d55039cb983'::uuid),
    ('8feb5558-c598-409c-8336-5fc713200d2e'::uuid),
    ('ba107f63-a67e-4337-a812-d0af7e22c809'::uuid),
    ('c6a1c90e-aa9e-4601-9c11-632c98b2d303'::uuid),
    ('cd7ba573-a5db-4080-a8d9-ea425da8b370'::uuid)
)
select
  (select count(*) from listed) as listed,
  (select count(distinct q.question_group_id) from public.quiz_questions q
     where jsonb_array_length(q.options) < 4) as actual,
  (select count(distinct q.question_group_id) from public.quiz_questions q
     join listed l on l.question_group_id = q.question_group_id
     where jsonb_array_length(q.options) < 4) as matched;

-- ============================================================================
-- 2. RETIRE. Only after statement 1 returns 76 / 76 / 76.
--    Re-runnable: the where clause skips rows already retired.
-- ============================================================================

with listed(question_group_id) as (values
    ('92d4344f-195e-4c44-a689-d3751e8817f2'::uuid),
    ('b0f73a33-ac73-48f4-9886-e4501c031830'::uuid),
    ('ef4b1a6a-075b-4985-bdef-763c2879abc8'::uuid),
    ('fbe99e0d-24b7-4472-a12c-377e3d31e828'::uuid),
    ('0d87f390-67d2-4662-b8ab-90011cc08a64'::uuid),
    ('c4eba722-49c9-42aa-94ce-6139f6d1a5f2'::uuid),
    ('036e06cf-4f31-484d-a4e3-981b8d4c50da'::uuid),
    ('2f69a943-df09-4aad-9922-251042147717'::uuid),
    ('39099075-0d5b-4c42-bd53-a1bb861a6977'::uuid),
    ('460ffb46-20ea-48c0-ae92-e732b430a3fc'::uuid),
    ('eba63864-8a9a-4c65-bd30-fab360ed8b31'::uuid),
    ('ed79047e-7c3f-4c64-a35c-21734fbf6768'::uuid),
    ('21ce9052-dc9b-498e-8e64-003e538a4374'::uuid),
    ('2dd2a6ee-52d1-4d7c-96bd-998452822ad0'::uuid),
    ('b5a490dd-52ed-407b-af1d-cb87d098687a'::uuid),
    ('ca2015ba-b6c2-45a1-92bd-cec9a8cb5a26'::uuid),
    ('8602fb2c-a909-40b2-8486-2c828e17bf4b'::uuid),
    ('fd5dd074-cb4f-465a-a775-a1128ce0d131'::uuid),
    ('4c4c9c87-18ef-4a65-80c3-19ca0753468e'::uuid),
    ('4c75fab8-b6ff-47c8-b804-05db70ceba88'::uuid),
    ('86e4f204-dae6-4c59-b348-29cd748a3f92'::uuid),
    ('a8fed1f5-bea8-4f50-bdcd-272ff3498ecf'::uuid),
    ('7987b453-a887-45e6-86d3-ef6261e114a9'::uuid),
    ('9c2cc5b4-19b9-475a-b810-18407af757eb'::uuid),
    ('b9a6f7f4-9f2c-462d-8904-2db521de08ca'::uuid),
    ('1ab939a2-9876-4981-b3ed-7605d0476a38'::uuid),
    ('2ffe6943-cff1-41a8-a5ae-fd399a55f315'::uuid),
    ('48a319a2-0c6f-42d4-8980-e20e3edb78aa'::uuid),
    ('5fe90e7f-c6b9-49be-bcca-f4ffaec7b5ac'::uuid),
    ('9a795eda-3015-482b-b53f-3e36c5fea47e'::uuid),
    ('c49e0105-03b3-4565-92f3-f3087565b5a7'::uuid),
    ('0d5dca42-e757-4a94-900d-49f6d0e49c1a'::uuid),
    ('218b3e7a-9a46-4208-9041-63e81610d631'::uuid),
    ('2e2e8364-eb32-4f5b-80cb-61f803d1dfd8'::uuid),
    ('398ad506-41e6-4b7e-be8c-6d3182b5d143'::uuid),
    ('4f415752-c7f7-42ce-9608-d40ea5b571fa'::uuid),
    ('5cbc3726-e762-49f4-a7b9-18f270aa8085'::uuid),
    ('6e3519f0-d545-4fe3-a262-445614b1ab04'::uuid),
    ('8119cc19-4a98-4d9a-8e02-1294caa3f533'::uuid),
    ('98062d93-4f04-44f4-bd4e-c8d3f4a2f31e'::uuid),
    ('a3e3134f-2f35-4f6c-83b2-1f9d6f3588dd'::uuid),
    ('d6cd730d-b282-4893-9a46-3daa8a8f5d8a'::uuid),
    ('22c4f784-df81-4e91-ae8a-bf58e5e1753f'::uuid),
    ('6dd576c3-617e-4771-97ae-c0157d0e0239'::uuid),
    ('84e4cd2f-46c3-4a40-b9fc-5be795b47df1'::uuid),
    ('86ba2015-b13e-4fa8-a8b0-344f82a9dabd'::uuid),
    ('92c98f6b-8075-49c9-b823-7216f9892e5e'::uuid),
    ('955b4708-473f-4243-88ae-1a0eef59cb1a'::uuid),
    ('a25deabc-9ac3-4674-8a36-78f67367ac35'::uuid),
    ('a960f9fd-feef-4cb9-8815-bb3d0f6a6857'::uuid),
    ('ac6778c5-2559-4a38-8a45-b1f15b3ec82b'::uuid),
    ('d38ad4d7-5f40-4b44-99da-e1a82b5342e4'::uuid),
    ('f1282277-30b2-4bac-afd4-092598c78aeb'::uuid),
    ('36e68523-c626-4951-aa61-4c038a6d2e30'::uuid),
    ('4194556a-41d4-4897-8879-d5e1d51a3a84'::uuid),
    ('455e2c03-417f-4e6c-84f6-e99106198256'::uuid),
    ('4d132428-8dc6-49b2-9a1d-a645f354f352'::uuid),
    ('5ba440fe-340e-4e09-bb50-122e482983d6'::uuid),
    ('864155fc-ad45-4654-a195-63ce4bff6690'::uuid),
    ('98ebc308-d300-4901-b81b-a5dbe98a5939'::uuid),
    ('ac6b200e-f503-4995-b55d-113842003b68'::uuid),
    ('d05365ea-3463-4f4a-ba40-33a3374c9696'::uuid),
    ('d2bbb96e-2604-4076-84c6-5ea06e468308'::uuid),
    ('dd98e71c-aab5-485c-8005-75e47a749a19'::uuid),
    ('2058b3c8-5288-4d19-a9c7-6e31efe69a6c'::uuid),
    ('35cc32fd-ecc6-49e9-8638-b9ee8d138474'::uuid),
    ('69517866-cde6-4e4e-a1a6-45680ead86d8'::uuid),
    ('95d2cdb1-817e-4d33-a575-e45df6592435'::uuid),
    ('0da03243-7ae4-4b31-80d4-57eab965c5bf'::uuid),
    ('34ff481d-fcbd-4c66-8107-1ad2470c959e'::uuid),
    ('38088e00-19a6-445a-9f42-c8c70354f40a'::uuid),
    ('712aa64f-7211-4cce-8458-0d55039cb983'::uuid),
    ('8feb5558-c598-409c-8336-5fc713200d2e'::uuid),
    ('ba107f63-a67e-4337-a812-d0af7e22c809'::uuid),
    ('c6a1c90e-aa9e-4601-9c11-632c98b2d303'::uuid),
    ('cd7ba573-a5db-4080-a8d9-ea425da8b370'::uuid)
)
update public.quiz_questions q
set retired_at    = now(),
    retire_reason = 'Two-option item: a guesser scores 50 percent. No minimum option count existed in LESSON_AUTHORING_SPEC or in any verify-cert invariant, and the answer-position guard skips items with fewer than three options, so nothing detected these. Replacements generated to the per-task floor.',
    status        = 'rejected'
from listed l
where q.question_group_id = l.question_group_id
  and q.retired_at is null;

-- ============================================================================
-- PROOF
-- ============================================================================

-- 3. Every defective row retired, all three languages. Expect 228 rows / 76 groups.
select count(*) as retired_rows,
       count(distinct question_group_id) as retired_groups
from public.quiz_questions
where retired_at is not null;

-- 4. No LIVE item anywhere has fewer than four options. Expect 0 rows.
select c.code, q.pool, q.language, count(*) as n
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where jsonb_array_length(q.options) < 4 and q.retired_at is null
group by c.code, q.pool, q.language;

-- 5. The 8 attempts survive and stay traceable. This is 089's whole point.
select certification, pool, count(*) as items, sum(times_presented) as attempts
from public.v_retired_items_evidence
group by certification, pool order by certification, pool;

-- 6. Live stock per cert, pool and language - the deficit the generators fill.
select c.code, q.pool, q.language, count(*) as live_items
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where q.retired_at is null and c.code in
  ('AIE-I','AIHR-I','AISM-I','ISMS-F','SD-AI-I','SM-AI-I','SPO-AI-I')
group by c.code, q.pool, q.language
order by c.code, q.pool, q.language;
