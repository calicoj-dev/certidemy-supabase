-- 075_fix_module06_stale_task_codes.sql
-- SM-AI-I traceability fix: Module 06 (AI-augmented teams) lessons carried stale
-- pre-remap task_codes (6.1-6.7) in their content_md frontmatter, across all
-- three languages. No 6.x tasks exist; the AI concepts were remapped into
-- domains 1-5. The DISK en frontmatter already declared the correct codes, but
-- that was never propagated to the DB, and the es-419/pt-BR translations live
-- only in the DB (no disk source). Fixed content_md directly with an exact
-- ASCII substring replace (safe from multibyte paste corruption -- touches only
-- the task_codes value, not translated prose). Clears the "6.1-6.7 UNRESOLVED"
-- report from wire-lessons. Idempotent: re-running finds nothing to replace.
--
-- Mapping (matches the DISK en frontmatter; all targets exist as tasks):
--   06-01 ai-agents-as-tools            [6.1]       -> [2.10]
--   06-02 definition-of-done-and-ai     [6.2]       -> [4.11]
--   06-03 new-impediments-ai-teams      [6.3]       -> [5.10]
--   06-04 empiricism-under-acceleration [6.4, 6.6]  -> [1.7, 3.11]
--   06-05 what-to-delegate-what-to-keep [6.5]       -> [2.11]
--   06-06 coaching-the-ai-augmented...  [6.7]       -> [5.11]
begin;

update public.lessons set content_md = replace(content_md, 'task_codes: [6.1]', 'task_codes: [2.10]')
  where slug = '06-01-ai-agents-as-tools'            and content_md like '%task_codes: [6.1]%';

update public.lessons set content_md = replace(content_md, 'task_codes: [6.2]', 'task_codes: [4.11]')
  where slug = '06-02-definition-of-done-and-ai'     and content_md like '%task_codes: [6.2]%';

update public.lessons set content_md = replace(content_md, 'task_codes: [6.3]', 'task_codes: [5.10]')
  where slug = '06-03-new-impediments-ai-teams'      and content_md like '%task_codes: [6.3]%';

update public.lessons set content_md = replace(content_md, 'task_codes: [6.4, 6.6]', 'task_codes: [1.7, 3.11]')
  where slug = '06-04-empiricism-under-acceleration' and content_md like '%task_codes: [6.4, 6.6]%';

update public.lessons set content_md = replace(content_md, 'task_codes: [6.5]', 'task_codes: [2.11]')
  where slug = '06-05-what-to-delegate-what-to-keep' and content_md like '%task_codes: [6.5]%';

update public.lessons set content_md = replace(content_md, 'task_codes: [6.7]', 'task_codes: [5.11]')
  where slug = '06-06-coaching-the-ai-augmented-team' and content_md like '%task_codes: [6.7]%';

commit;
