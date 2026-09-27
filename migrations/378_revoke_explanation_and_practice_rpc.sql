-- 378_revoke_explanation_and_practice_rpc.sql
--
-- TWO REVOKES FROM THE KEY-EXPOSURE SWEEP. Neither is the hole that was closed in the function on
-- 2026-09-27; both are the same question asked of PostgREST instead of an edge function, and both
-- are closed today by accident rather than by intent.
--
-- ============ (1) quiz_questions.explanation, REVOKED FROM anon AND authenticated ============
--
-- Measured as a stranger: `correct_answer` is correctly ungranted at column level, and every secure
-- item carries visibility='secure' which no read policy matches -- so the KEY is unreachable and so
-- is every secure row. What IS reachable is 15,388 PRACTICE rows, and `explanation` is granted, so
-- an authenticated learner can read the explanation of every practice item IN BULK, BEFORE
-- answering it. An explanation usually names the correct option in prose.
--
-- THE READER LIST, and it is why this revoke is safe. Every path that legitimately serves an
-- explanation goes through something that is not a direct table read:
--
--   submit-quiz-answer     service_role, and only AFTER grading the caller's own answer
--   get_session_review     SECURITY DEFINER, caller's own attempts, pool='practice' AND
--                          is_exam_scope=false
--   get_public_samples     SECURITY DEFINER, visibility='public' -- the 216 public sample items
--
-- `certidemy-web` was read (read-only, not modified) and NO `.select()` anywhere in it names
-- `explanation`. `lib/quiz/session-detail.ts` reads it through `rpc("get_session_review")`, and
-- `components/quiz/quiz-player.tsx` receives it in submit-quiz-answer's response. The quiz player's
-- own question fetch selects `id, question_text, question_type, options, difficulty, bloom_level` --
-- explanation is absent by design, with the comment "no correct_answer; graded server-side".
--
-- A SECURITY DEFINER FUNCTION IS UNAFFECTED BY A CALLER'S COLUMN GRANT, which is what makes this a
-- revoke and not a breakage: the two definer functions run as the table's owner, so they keep
-- reading the column after anon and authenticated stop being able to.
--
-- `question_text` KEEPS ITS GRANT. The quiz player selects it directly, so revoking it would take
-- the practice player down. Narrow on purpose: the column being revoked is the one nothing reads.
--
-- ============ (2) create_practice_questions, EXECUTE REVOKED FROM BOTH ROLES ============
--
-- It is granted to `anon` and `authenticated`, is NOT security definer, and writes to
-- quiz_questions. It is harmless today only because neither role holds INSERT on the table, so the
-- write is refused by a grant one layer down -- a closed door held shut by a second door.
--
-- Both callers use the SERVICE ROLE, checked rather than assumed:
--   functions/generate-practice-questions/index.ts:381   svc = getServiceClient()
--   scripts/backfill-practice.mjs:478                    SUPABASE_SERVICE_ROLE_KEY
--
-- Nothing calls it as anon or authenticated, so it is revoked from both. service_role keeps EXECUTE.
--
-- ============ ONE STATEMENT, AND BOTH DIRECTIONS ASSERTED ============
--
-- `begin; ... commit;` in the SQL editor asserts an intent, not a transaction. One DO block is one
-- transaction under every pooling mode. The post-conditions assert what must STOP being true AND
-- what must STAY true -- a revoke that over-reached would take the quiz player down, and asserting
-- only the negative half would not notice.

do $$
declare
  n_definer int;
begin
  ---------------------------------------------------------------------------
  -- (1) the explanation column
  ---------------------------------------------------------------------------
  revoke select (explanation) on public.quiz_questions from anon, authenticated;

  ---------------------------------------------------------------------------
  -- (2) the practice-insert RPC
  --
  -- ============ REVOKED FROM PUBLIC FIRST, AND THAT IS THE WHOLE CORRECTION ============
  --
  -- The first version of this migration said `from anon, authenticated` and FAILED on its own
  -- post-condition in Juan's hands:
  --
  --   ERROR P0001: create_practice_questions is still executable by anon or authenticated
  --
  -- Measured rather than assumed. The function's ACL is:
  --
  --   EXECUTE granted to:  PUBLIC, postgres, service_role
  --
  -- `anon` and `authenticated` appear NOWHERE in it. They hold EXECUTE through PUBLIC, which is
  -- the Postgres DEFAULT for a function -- so `revoke ... from anon, authenticated` removed nothing,
  -- succeeded silently, and the post-condition then correctly refused to believe it.
  --
  -- THIS IS THIS REPOSITORY'S OWN RULE, WITH THE REVOKE ON THE WRONG SIDE OF IT. The rule says a
  -- privilege check must ask `has_*_privilege` because an ACL comparison sees only what someone
  -- TYPED. The post-condition did exactly that and was right. The REVOKE was the half written
  -- against what I assumed had been typed -- and you cannot revoke a grant that was never made.
  --
  -- A COLUMN GRANT DOES NOT HAVE THIS SHAPE, checked before shipping the fix rather than after:
  -- the column ACLs for `explanation` and `question_text` name `anon, authenticated` DIRECTLY, and
  -- `correct_answer` has no column ACL at all. So (1) above targets real grants and needed no
  -- change. Fixing one instance of a class and leaving its sibling unexamined is how the next
  -- failure gets written.
  --
  -- service_role is GRANTED BACK EXPLICITLY. It already holds EXECUTE directly, so revoking PUBLIC
  -- would not have stripped it -- but the real callers depend on it
  -- (generate-practice-questions via getServiceClient, backfill-practice.mjs via the service key),
  -- and a grant that exists only because nothing removed it is the kind this migration is cleaning
  -- up. Idempotent, and it makes the intent legible.
  ---------------------------------------------------------------------------
  revoke execute on function public.create_practice_questions(jsonb) from public, anon, authenticated;
  grant  execute on function public.create_practice_questions(jsonb) to service_role;

  ---------------------------------------------------------------------------
  -- POST-CONDITIONS. Both directions, asked with has_*_privilege rather than read off an ACL:
  -- an ACL comparison sees only what someone typed and misses membership, which is how a check
  -- in this repository once reported no gap while the role running it was in the gap.
  ---------------------------------------------------------------------------

  -- NEGATIVE: explanation is gone for both roles.
  if has_column_privilege('anon', 'public.quiz_questions'::regclass, 'explanation', 'SELECT')
     or has_column_privilege('authenticated', 'public.quiz_questions'::regclass, 'explanation', 'SELECT') then
    raise exception 'explanation is still selectable by anon or authenticated';
  end if;

  -- POSITIVE, and this is the half that catches an over-reach: the practice player must still work.
  -- These are the exact columns certidemy-web selects for a playable question.
  if not (has_column_privilege('authenticated', 'public.quiz_questions'::regclass, 'question_text', 'SELECT')
      and has_column_privilege('authenticated', 'public.quiz_questions'::regclass, 'question_type', 'SELECT')
      and has_column_privilege('authenticated', 'public.quiz_questions'::regclass, 'options', 'SELECT')
      and has_column_privilege('authenticated', 'public.quiz_questions'::regclass, 'difficulty', 'SELECT')
      and has_column_privilege('authenticated', 'public.quiz_questions'::regclass, 'bloom_level', 'SELECT')) then
    raise exception 'the revoke over-reached: the quiz player can no longer read a playable question';
  end if;

  -- AND THE KEY WAS NEVER GRANTED AND STILL IS NOT. Asserted here because this migration is about
  -- column grants, and the one column that matters most is the one it does not touch.
  if has_column_privilege('anon', 'public.quiz_questions'::regclass, 'correct_answer', 'SELECT')
     or has_column_privilege('authenticated', 'public.quiz_questions'::regclass, 'correct_answer', 'SELECT') then
    raise exception 'correct_answer is selectable by anon or authenticated -- this migration did not cause it, and it must not be true';
  end if;

  -- NEGATIVE: the RPC is gone for both roles.
  if has_function_privilege('anon', 'public.create_practice_questions(jsonb)'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'public.create_practice_questions(jsonb)'::regprocedure, 'EXECUTE') then
    raise exception 'create_practice_questions is still executable by anon or authenticated';
  end if;

  -- AND PUBLIC IS NAMED, because PUBLIC is what actually held it. `has_function_privilege('anon',
  -- ...)` already returns false once PUBLIC is revoked, so this assertion is redundant to the check
  -- above -- and it is here anyway: the first version of this migration failed because nobody had
  -- looked at PUBLIC, and an assertion that names the cause is what stops the next reader repeating
  -- the mistake on a different object. Read from the ACL deliberately, since PUBLIC is not a role
  -- has_function_privilege can be asked about.
  if exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      cross join aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as a
     where n.nspname = 'public' and p.proname = 'create_practice_questions'
       and a.privilege_type = 'EXECUTE' and a.grantee = 0
  ) then
    raise exception 'PUBLIC still holds EXECUTE on create_practice_questions -- every role inherits it';
  end if;

  -- POSITIVE: service_role keeps it, or the generator and the backfill script both stop working.
  if not has_function_privilege('service_role', 'public.create_practice_questions(jsonb)'::regprocedure, 'EXECUTE') then
    raise exception 'service_role lost EXECUTE on create_practice_questions -- the generator cannot persist';
  end if;

  -- AND THE TWO DEFINER FUNCTIONS THAT STILL NEED THE COLUMN ARE STILL DEFINER. If either were ever
  -- changed to INVOKER, this revoke would silently break the review screen and the public samples --
  -- the reachability lesson this repository already paid for on mcp.concept.
  select count(*) into n_definer
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('get_session_review', 'get_public_samples')
     and p.prosecdef;
  if n_definer <> 2 then
    raise exception 'get_session_review and get_public_samples must both be SECURITY DEFINER to survive this revoke; found % of 2', n_definer;
  end if;

  raise notice '378 ok: explanation revoked from anon+authenticated, create_practice_questions revoked from both, player columns intact';
end $$;
