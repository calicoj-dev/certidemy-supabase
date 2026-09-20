-- 352_translation_side_hash.sql
--
-- A review hashes BOTH sides. English drift re-closes the gate; so does
-- translation drift.
--
-- ============ THE HOLE ============
--
-- Every review keys on a hash of the ENGLISH. So an approved translation can
-- be rewritten to say anything and the approval stands -- and the approvals are
-- exactly the rows the gate lets through, so the hole opens only on text a
-- human has signed. The signature is what makes it reachable.
--
-- ============ IT IS THREE TABLES, NOT TWO ============
--
--   lesson_translation_reviews    41   gates mcp.lesson via lesson_body_is_servable
--   task_translation_reviews      98   gates mcp.task via task_ksa_is_withheld
--   item_translation_reviews      30   GATES NOTHING -- read by no view and no
--                                      function, measured against pg_proc and
--                                      pg_views. A record, not a gate.
--
-- 169 approvals, not the 139 the first count gave: `item_translation_reviews`
-- has the identical shape and was missed because nothing reads it, which is
-- also why its hole is theoretical. It gets the column anyway -- a review that
-- cannot detect drift is worth no more here than there, and the day something
-- starts reading it is not the day to discover this.
--
-- ============ DOES A TWO-HASH GATE BREAK A LEGITIMATE EDIT? ============
--
-- Two candidate classes of post-review edit that change bytes without changing
-- meaning. Only one of them is real:
--
--   MARKER-ONLY EDITS -- NOT EXEMPT, and this repository already proved why.
--   `restore-quote-markers.mjs` prepends a `>` and "does not touch a single
--   word of any translation". It is still the difference between an attributed
--   quotation and unattributed reproduction, which is precisely what
--   IP-POSITION section 6 turns on. A marker change MUST re-close the gate.
--   The same goes for the modal-vocabulary sweeps: both times a "mechanical"
--   translation edit was performed here it turned out to be meaning-bearing.
--
--   LINE ENDINGS -- EXEMPT. A CRLF normalisation once rewrote 232 rows and
--   changed nothing a reader could see. So the translation hash strips CRs,
--   matching what 244, 245 and 249 already do for prosrc.
--
-- THE en_hash SIDE IS NOT CHANGED and therefore does not strip. That asymmetry
-- is deliberate: redefining en_hash would invalidate all 169 existing
-- approvals to fix a case that has happened once. Recorded as a wart with its
-- reason rather than tidied into a second convention nobody can predict.
--
-- ============ AND THE 02-03 pt-BR EDIT WOULD NOT HAVE RE-CLOSED ANYTHING ====
--
-- It is the obvious counter-example and it does not hold: the voice edit was
-- applied BEFORE its review row was written, in the same sequence -- edit, then
-- verify the six hashes, then insert. Under a two-hash gate the tr_hash would
-- have captured the corrected text.
--
-- THE SCHEMA CANNOT PROVE THAT, and the reason is the next entry.
--
-- ============ WHAT NULL WOULD HAVE MEANT, AND WHY IT DOES NOT ARISE ========
--
-- A new column is null on all 169. Treating null as unverified withholds rows
-- already read -- ISMS-F would fall from 49/49. Treating it as grandfathered
-- keeps the hole on exactly the rows that matter. So neither: BACKFILL, and
-- record per row whether the backfilled value was MEASURED or ASSUMED.
--
--   task_translation_reviews    MEASURED. `task_translations` carries
--     `updated_at`, and 0 of 98 rows were edited after their review -- the
--     latest edit is 2026-08-04 and the earliest review 2026-09-17, six weeks
--     apart. Backfilling those asserts something checked.
--
--   lesson_translation_reviews  ASSUMED. `lessons` has NO `updated_at`. There
--   item_translation_reviews    is no way to ask whether a row changed after
--     its review, so the backfill claims only "unchanged as of 352", never
--     "unchanged since review". `tr_hash_basis` records which, permanently.
--
-- THAT MISSING COLUMN IS WHY THE GAP WAS INVISIBLE. A table that cannot say
-- when it last changed cannot be audited for drift, and `lessons` and
-- `quiz_questions` both lack it. Adding it is a separate migration and is
-- worth one.
--
-- ============ NULL FAILS CLOSED WITHOUT A SPECIAL CASE ============
--
-- Going forward a writer that forgets `tr_hash` writes null, and
-- `r.tr_hash = public.translation_hash(...)` is then NULL, which is not TRUE,
-- so the gate withholds. No branch is needed and none is written: the
-- comparison already fails in the safe direction.
--
-- ============ ITS FIRST RUN ABORTED ON A LITERAL, AND THE DATABASE WAS RIGHT ============
--
-- It asserted `ISMS-F serves 98 non-English bodies` and found 97, with a DETAIL
-- blaming a tr_hash mismatch -- a cause the check had never measured. The count
-- was the assertion; the detail was a guess attached to it.
--
-- The missing row is `02-03-amendment-1-2024` pt-BR. Measured before changing
-- anything: its review is fine (en_hash matches the live English, verdict
-- approved) and no translation had drifted. It is withheld because a voice edit
-- fired `trg_lessons_clear_mcp_servable`, which nulls mcp_servable and the scan
-- fields on any content_md change, and scan-iso-leaks has not run since. Its two
-- siblings still read the 2026-09-18 scan; this row reads NEVER SCANNED.
--
-- So 98 was measured before that edit and 352 never touched it. FOURTH literal
-- in a week to abort against a correct database -- after 328s expected 4, 345s
-- 12637 and 351s 13, and after the rule those produced. The rule was written and
-- then broken by its author, which is the same shape CLAUDE.md already records
-- twice. Only the mechanism transfers: checks 2 and 3 now capture the served set
-- BEFORE and compare AFTER, with no number in either.
--
-- AND THE WITHHELD LESSON IS A REAL FINDING, LEFT AS FOUND. A translation edit
-- silently removes a body from the MCP surface until someone re-runs the scan,
-- and nothing reports it. Fail-closed and correct; invisible and unowned.
---- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_lesson int; n_task int; n_item int;
  n_l_after int; n_t_after int; n_i_after int;
  n_drift int;
  served_before text; served_after text;
  n_serv_before int; n_serv_after int; n_noneng int;
begin

  -- ----------------------------------------------- pre-conditions
  select count(*) into n_lesson from public.lesson_translation_reviews;
  select count(*) into n_task   from public.task_translation_reviews;
  select count(*) into n_item   from public.item_translation_reviews;
  if n_lesson = 0 or n_task = 0 then
    raise exception 'no reviews to migrate (lesson %, task %)', n_lesson, n_task;
  end if;

  -- The MEASURED claim, re-checked rather than carried from the diagnosis.
  select count(*) into n_drift
    from public.task_translation_reviews r
    join public.task_translations tt on tt.id = r.task_translation_id
   where tt.updated_at > r.reviewed_at;
  if n_drift <> 0 then
    raise exception '% task translation(s) changed after review -- backfilling them would launder drift into an approval', n_drift
      using hint = 'Those rows need re-reading, not a backfilled hash.';
  end if;

  -- ----------------------------------------------- what must not move
  -- CAPTURED BEFORE THE BACKFILL, COMPARED AFTER, CARRYING NO NUMBER.
  --
  -- The first version asserted `ISMS-F serves 98` and aborted against a correct
  -- database that served 97. The missing row was `02-03-amendment-1-2024` pt-BR,
  -- withheld since a voice edit fired trg_lessons_clear_mcp_servable and no scan
  -- has run since -- nothing to do with this migration, and the DETAIL blamed a
  -- tr_hash mismatch the check had never measured.
  --
  -- Fourth literal in a week to abort against a database that was right. The
  -- servable set is the property; its size is a fact about a day.
  execute 'set local role mcp_holder';
  select count(*),
         md5(coalesce(string_agg(certification || '/' || lesson_slug || '/' || language,
                                 ',' order by certification, lesson_slug, language), ''))
    into n_serv_before, served_before
    from mcp.lesson where language <> 'en';
  select count(*) into n_noneng
    from mcp.lesson_index where language <> 'en';
  execute 'reset role';
  raise notice 'before -- % of % non-English bod(ies) served', n_serv_before, n_noneng;

  -- ----------------------------------------------- the hash, one definition
  -- Length-prefixed, delegating to ksa_en_hash so field boundaries cannot be
  -- forged by concatenation, and CR-stripped for the reason in the header.
  create or replace function public.translation_hash(
    p_a text, p_b text default null, p_c text default null)
  returns text language sql immutable
  set search_path = ''
  as $fn$
    select public.ksa_en_hash(
      replace(coalesce(p_a, ''), chr(13), ''),
      replace(coalesce(p_b, ''), chr(13), ''),
      replace(coalesce(p_c, ''), chr(13), ''))
  $fn$;

  comment on function public.translation_hash(text, text, text) is
    'Hash of the TRANSLATED side of a review, so translation drift re-closes a gate the way English drift already does. CR-stripped; en_hash is not, deliberately - see migration 352.';

  -- ----------------------------------------------- the columns
  alter table public.lesson_translation_reviews add column if not exists tr_hash text;
  alter table public.lesson_translation_reviews add column if not exists tr_hash_basis text;
  alter table public.task_translation_reviews   add column if not exists tr_hash text;
  alter table public.task_translation_reviews   add column if not exists tr_hash_basis text;
  alter table public.item_translation_reviews   add column if not exists tr_hash text;
  alter table public.item_translation_reviews   add column if not exists tr_hash_basis text;

  -- 'observed'  written by a reviewer against the text they read
  -- 'measured'  backfilled, and the source table proved no drift since review
  -- 'assumed'   backfilled, and the source table cannot say
  alter table public.lesson_translation_reviews drop constraint if exists ltr_tr_hash_basis_chk;
  alter table public.lesson_translation_reviews add constraint ltr_tr_hash_basis_chk
    check (tr_hash_basis is null or tr_hash_basis in ('observed','measured','assumed'));
  alter table public.task_translation_reviews drop constraint if exists ttr_tr_hash_basis_chk;
  alter table public.task_translation_reviews add constraint ttr_tr_hash_basis_chk
    check (tr_hash_basis is null or tr_hash_basis in ('observed','measured','assumed'));
  alter table public.item_translation_reviews drop constraint if exists itr_tr_hash_basis_chk;
  alter table public.item_translation_reviews add constraint itr_tr_hash_basis_chk
    check (tr_hash_basis is null or tr_hash_basis in ('observed','measured','assumed'));

  -- ----------------------------------------------- the backfill
  update public.lesson_translation_reviews r
     set tr_hash = public.translation_hash(l.content_md),
         tr_hash_basis = 'assumed'
    from public.lessons l
   where l.id = r.lesson_id and r.tr_hash is null;

  update public.task_translation_reviews r
     set tr_hash = public.translation_hash(tt.knowledge, tt.skills, tt.abilities),
         tr_hash_basis = 'measured'
    from public.task_translations tt
   where tt.id = r.task_translation_id and r.tr_hash is null;

  update public.item_translation_reviews r
     set tr_hash = public.translation_hash(q.question_text, q.options::text, q.explanation),
         tr_hash_basis = 'assumed'
    from public.quiz_questions q
   where q.id = r.question_id and r.tr_hash is null;

  -- ----------------------------------------------- the gates
  create or replace function public.lesson_body_is_servable(p_lesson_id uuid)
  returns boolean language sql stable security definer set search_path = ''
  as $fn$
    select l.mcp_servable
       and (
         l.language = 'en'
         or not l.mcp_translation_review_required
         or exists (
           select 1
             from public.lesson_translation_reviews r
             join public.lessons en
               on en.lesson_group_id = l.lesson_group_id
              and en.language = 'en'
            where r.lesson_id = l.id
              and r.verdict = 'approved'
              and r.en_hash = left(md5(en.content_md), 8)
              and r.tr_hash = public.translation_hash(l.content_md)
         )
       )
      from public.lessons l
     where l.id = p_lesson_id
  $fn$;

  create or replace function public.task_ksa_is_withheld(p_tt_id uuid)
  returns boolean language sql stable security definer set search_path = ''
  as $fn$
    select tt.ksa_is_provisional
       and not exists (
         select 1
           from public.task_translation_reviews r
          where r.task_translation_id = tt.id
            and r.verdict = 'approved'
            and r.en_hash = public.task_ksa_en_hash(tt.task_id)
            and r.tr_hash = public.translation_hash(tt.knowledge, tt.skills, tt.abilities)
       )
      from public.task_translations tt
     where tt.id = p_tt_id
  $fn$;

  -- ===================== POST-CONDITIONS =====================

  -- 1. EVERY APPROVAL CARRIES BOTH HASHES NOW.
  select count(*) into n_l_after from public.lesson_translation_reviews where tr_hash is null;
  select count(*) into n_t_after from public.task_translation_reviews   where tr_hash is null;
  select count(*) into n_i_after from public.item_translation_reviews   where tr_hash is null;
  if n_l_after <> 0 or n_t_after <> 0 or n_i_after <> 0 then
    raise exception 'tr_hash still null on % lesson, % task, % item review(s)',
      n_l_after, n_t_after, n_i_after;
  end if;

  -- 2. THE SERVED SET IS BYTE-IDENTICAL. Not its size -- the set. This migration
  --    backfills tr_hash from the CURRENT translation, so by construction every
  --    gate that was open stays open and no closed one opens. A count would pass
  --    on one lesson closing while another opened.
  execute 'set local role mcp_holder';
  select count(*),
         md5(coalesce(string_agg(certification || '/' || lesson_slug || '/' || language,
                                 ',' order by certification, lesson_slug, language), ''))
    into n_serv_after, served_after
    from mcp.lesson where language <> 'en';
  execute 'reset role';
  if served_before is distinct from served_after then
    raise exception 'the set of served non-English bodies changed (% before, % after)',
      n_serv_before, n_serv_after
      using detail = 'tr_hash is backfilled from the current translation, so nothing should move.',
            hint  = 'Diff mcp.lesson before and after. Do NOT backfill anything to make this pass.';
  end if;

  -- 3. AND THE COMPARISON WAS NOT VACUOUS. Two empty sets have equal checksums,
  --    and so do two complete ones. Check 2 means something only where the gate
  --    is both serving and withholding.
  if n_serv_before = 0 then
    raise exception 'no non-English body was served before this ran -- check 2 is vacuous';
  end if;
  if n_noneng <= n_serv_before then
    raise exception 'all % non-English bod(ies) are served -- the gate withholds nothing, so check 2 could not see it open',
      n_noneng;
  end if;
  raise notice 'ok: served set unchanged (% served, % withheld)', n_serv_after, n_noneng - n_serv_after;

  -- 4. NEGATIVE. The gate can still close. A stored hash that matches anything
  --    is indistinguishable from no gate, so mutate the text and require the
  --    comparison to fail.
  if exists (
    select 1 from public.lesson_translation_reviews r
     join public.lessons l on l.id = r.lesson_id
    where r.tr_hash = public.translation_hash(l.content_md || ' ')
  ) then
    raise exception 'a mutated translation still matches its stored hash -- the hash is not sensitive';
  end if;

  -- 5. AND THE BASIS IS RECORDED, so a backfilled claim is never mistaken for
  --    an observed one.
  select count(*) into n_t_after
    from public.task_translation_reviews where tr_hash_basis = 'measured';
  if n_t_after <> n_task then
    raise exception 'only % of % task review(s) are marked measured', n_t_after, n_task;
  end if;

  raise notice '352 ok: % lesson (assumed), % task (measured), % item (assumed) review(s) now hash both sides',
    n_lesson, n_task, n_item;
end
$mig$;
