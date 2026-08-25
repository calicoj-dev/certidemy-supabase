-- 247_credential_idempotency.sql
--
-- Makes a credential mint repeatable, so a re-uploaded CSV cannot issue the
-- same person the same award twice.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-25, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes.
--
-- ============================ HOW THIS ONE IS VERIFIED ===================
--
-- 244 and 245 recorded an md5 of prosrc, because what they recorded was a
-- FUNCTION BODY and the body is the thing that can drift. There is no function
-- here. The verifiable artefacts are the column type and the index definition,
-- so section 3 records what pg_get_indexdef and format_type returned, verbatim,
-- and those strings are what a later reader compares against. Same discipline,
-- different artefact -- writing "md5 verified" here would be borrowing the
-- form of a check that was never run.
--
-- ============================ WHAT IT IS FOR ============================
--
-- A 40-row CSV that fails at row 27 gets re-uploaded. Without a key that
-- survives the re-upload, rows 1-26 mint a second time.
--
-- That is not a tidiness problem. A credential row is permanent: revocation is
-- a status change, never a delete, so a duplicate stays at
-- credentials.certidemy.com/credentials/<code> forever, and each one consumes a
-- status_list_index from a sequence that only moves forward -- one of the four
-- immovable OB3 identifier URLs.
--
-- Before this migration NOTHING prevented that. The unique indexes on
-- credentials were (id), (credential_code), (issuer_id, status_list_index), and
-- (user_id, certification_id) WHERE status = 'active'. That last one looks like
-- it would help and does not: a partner credential has user_id NULL and
-- certification_id NULL, and NULLs are distinct in a btree unique index, so any
-- number of rows satisfy it. holder_email carried only a NON-unique partial
-- index. Two identical issuances were two rows, silently.
--
-- ============================ WHY THIS SHAPE ============================
--
-- Copied from issuer_api_requests_idempotency_unique (migration 232), which has
-- solved the same problem for the machine API since it shipped:
--
--   UNIQUE (issuer_id, idempotency_key) WHERE idempotency_key IS NOT NULL
--
-- Scoped by ISSUER, not global: a key is a partner's own word for a batch and
-- two partners may reasonably use the same one. PARTIAL on is-not-null, so the
-- twelve rows that predate this migration -- and every future mint that passes
-- no key -- are unconstrained rather than colliding on NULL.
--
-- NULLABLE, and it stays nullable. issue-partner-credential does not set it:
-- that API already has idempotency through issuer_api_requests and its own
-- unique index, and adding a second mechanism would give one request two
-- answers about whether it was a replay.
--
-- ============================ WHO DERIVES THE KEY =======================
--
-- Not the client. issue-credential-batch derives it server-side from the batch
-- label, the achievement code and the normalised email, and its header carries
-- the argument for why the label is the right identity: a generated id breaks
-- on re-upload, file content breaks when someone fixes a row, a human label
-- survives both.
--
-- A client that could send keys could make two recipients collide -- quietly
-- dropping one person from a cohort, noticed only when they ask where their
-- certificate is -- or send fresh keys every time and defeat the mechanism.
--
-- ============================ THE TWO 23505s ============================
--
-- credentials now has two unique indexes a mint can violate, and they mean
-- opposite things:
--
--   credentials_credential_code_key -- two random codes collided. Retry with a
--     new code. This is what the 5-attempt loop in _shared/issue.ts is for.
--
--   credentials_idempotency_unique  -- this row was already issued. Stop, read
--     the existing credential, return it, and do NOT re-queue webhooks.
--
-- Both raise 23505. _shared/issue.ts distinguishes them by the constraint name
-- in the error, because treating them alike either mints the duplicate this
-- migration exists to prevent (retrying an idempotency conflict with a fresh
-- code SUCCEEDS) or fails a recoverable collision.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. The column.
-- ---------------------------------------------------------------------------

alter table public.credentials
  add column if not exists idempotency_key text;

-- ---------------------------------------------------------------------------
-- 2. The unique index and the column comment.
--    Separate statements: create index is not something to bundle, and the
--    comment is documentation rather than structure.
-- ---------------------------------------------------------------------------

create unique index if not exists credentials_idempotency_unique
  on public.credentials (issuer_id, idempotency_key)
  where idempotency_key is not null;

comment on column public.credentials.idempotency_key is
  'Caller-derived key making a mint repeatable. Unique per issuer. issue-credential-batch derives it from the batch label, achievement code and normalised email; never accepted from a client. NULL means no protection, which is what every pre-247 row has.';

-- ---------------------------------------------------------------------------
-- 3. Verification. Observed live 2026-08-25 immediately after the statements
--    above. These three strings ARE the record -- compare against them rather
--    than against this file's SQL, which is what was typed, not what resulted.
-- ---------------------------------------------------------------------------

-- select a.attname, format_type(a.atttypid, a.atttypmod) as type, a.attnotnull as not_null
-- from pg_attribute a
-- where a.attrelid = 'public.credentials'::regclass and a.attname = 'idempotency_key';
--
-- OBSERVED, verbatim:
--   idempotency_key | text | false
--   (column_default: null)

-- select indexname, indexdef from pg_indexes
-- where schemaname = 'public' and indexname = 'credentials_idempotency_unique';
--
-- OBSERVED, verbatim:
--   CREATE UNIQUE INDEX credentials_idempotency_unique ON public.credentials USING btree (issuer_id, idempotency_key) WHERE (idempotency_key IS NOT NULL)

-- select col_description('public.credentials'::regclass,
--          (select attnum from pg_attribute
--            where attrelid = 'public.credentials'::regclass
--              and attname = 'idempotency_key'));
--
-- OBSERVED: the comment in section 2, character for character.

-- select count(*) from public.credentials where idempotency_key is not null;
-- OBSERVED: 0, against 12 credentials total. Every pre-247 row is unprotected,
-- which is correct -- they were minted under a different contract, and a
-- backfill would invent a batch identity nobody chose.

-- -- The index must actually reject. MUST fail with 23505 on the second insert;
-- -- run against a disposable issuer, never against a real one.
-- -- (Not run. Recorded as the shape of the check, not as something performed:
-- -- proving this by inserting two credentials would create the permanent rows
-- -- the migration exists to prevent. The mechanism is exercised instead by
-- -- issue-credential-batch, where a conflict is handled rather than raised.)
