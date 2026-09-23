-- PROBE: is a paste in the Supabase SQL editor ONE transaction on ONE backend?
--
-- 367 failed with: relation "_367_before" does not exist.
-- Two candidate causes with opposite implications:
--
--   A  the editor splits on semicolons and autocommits each statement.
--      Then `create temporary table ... on commit drop` drops immediately.
--      AND NO MIGRATION THIS REPOSITORY EVER RAN THROUGH THE EDITOR WAS
--      ATOMIC -- every post-condition that "aborted" did so after its own
--      writes had already committed.
--
--   B  the transaction is honoured but the statements do not share a backend.
--      A pooler in transaction mode can put statements on different
--      connections, and a temp table created on one is invisible from another.
--      367 breaks; atomicity is unaffected.
--
-- Evidence already favours B -- migration 366 v1 aborted on its own
-- post-condition and ROLLED BACK, which means a transaction was being held
-- that day. This probe is here because that is an inference and the question
-- is worth a measurement.
--
-- RUN AS ONE PASTE. Read the pids and the count together.

begin;
select pg_backend_pid() as pid_first;
create temporary table _probe_367 (x int);
insert into _probe_367 values (1);
select count(*) as visible_in_same_txn from _probe_367;
select pg_backend_pid() as pid_last;
commit;

-- HOW TO READ IT
--
--   visible_in_same_txn = 1
--       transaction and backend are shared. The fault is specific to
--       `on commit drop`, or to something else in 367.
--
--   error: relation "_probe_367" does not exist
--       then compare the two pids:
--         same pid    -> A. One backend, but each statement committed alone.
--                        Report it: it changes how every migration here is
--                        written, and the record needs to say which already
--                        applied migrations had post-conditions that could
--                        not have protected anything.
--         different   -> B. Pooler in transaction mode. Atomicity intact;
--                        367 simply must not span statements.
