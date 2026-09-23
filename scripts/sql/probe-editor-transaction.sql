-- PROBE v2: is a paste in the Supabase SQL editor ONE transaction?
--
-- ############ WHY v1 PROVED NOTHING, TWICE OVER ############
--
-- v1 returned only `pid_last`. The editor displays the LAST result set of a
-- submission, so `pid_first` and `visible_in_same_txn` were computed and
-- discarded.
--
--   A PROBE WHOSE ANSWER IS NOT IN ITS LAST RESULT SET HAS NO ANSWER IN THIS
--   EDITOR. Everything a diagnostic gathers goes into ONE FINAL ROW.
--
-- And it would have been uninformative even if all three had shown, because
-- v1's temp table had NO `on commit drop` -- and a plain temporary table is
-- scoped to the SESSION, not the transaction. It survives statement
-- boundaries whether or not each statement commits separately.
--
--   THE PROBE VARIED THE THING UNDER TEST OUT OF EXISTENCE.
--
-- ############ THE LEADING HYPOTHESIS, AND WHY IT IS ONLY THAT ############
--
-- `_367_before` was `on commit drop` and vanished before the next statement
-- saw it. That happens only if the creating statement COMMITTED -- candidate
-- A, the editor not holding one transaction across a submission. A passing v1
-- is fully consistent with A: session-scoped table, per-statement commits, no
-- contradiction.
--
-- If A is true it is much larger than 367: no migration run through this
-- editor was ever atomic, and every post-condition that "aborted" did so after
-- its own writes had already committed.
--
-- ############ THIS VERSION ############
--
-- txid_current() is the measurement and it cannot be engineered away: two
-- different values mean two transactions. Everything lands in one final row.

begin;
create temporary table _p367 (a text);
insert into _p367 select 'txid_1=' || txid_current()::text;
insert into _p367 select 'txid_2=' || txid_current()::text;
insert into _p367 select 'pid='    || pg_backend_pid()::text;
select string_agg(a, '  |  ' order by a) as result from _p367;
commit;
drop table if exists _p367;

-- HOW TO READ IT
--
--   two DIFFERENT txid values   -> each statement is its own transaction.
--                                  CANDIDATE A. Report it: 366's post-mortem
--                                  is then wrong, and the record needs to say
--                                  which applied migrations had post-conditions
--                                  that could not have protected anything.
--
--   one txid value              -> the submission is one transaction, and the
--                                  `on commit drop` failure needs a third
--                                  explanation nobody has proposed yet.
--
--   error: relation _p367 does not exist
--                               -> even the session-scoped table did not
--                                  survive, which is stronger evidence for A
--                                  than anything above.
