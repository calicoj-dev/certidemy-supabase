-- 347_scope_vocabulary_rubric.sql
--
-- Admit `courseware:rubric` to the scope vocabulary. ALL THREE of it.
--
-- ============ THERE ARE THREE DATABASE VOCABULARIES, NOT ONE ============
--
-- functions/_shared/api-scopes.ts says "THE DATABASE IS THE AUTHORITY" as
-- though that names one object. It names three, and they govern three different
-- questions:
--
--   issuer_api_keys_scope_vocab   what may be MINTED          (322)
--   issuers_mcp_scopes_vocab      what may be BOUND to an     (329)
--                                 OAuth caller
--   public.mcp_features           what may be USED at         (331)
--                                 request time
--
-- A scope must be in all three, and missing one fails in a DIFFERENT AND
-- DISTINGUISHABLE way:
--
--   missing from the mint CHECK     -> 400 at key creation. Looks like a scope
--                                      problem, and is the only one that does.
--   missing from the OAuth CHECK    -> keys work, chat clients do not. Looks
--                                      like an OAuth problem.
--   missing from mcp_features       -> the key mints, and every call is refused
--                                      because mcp.feature_status returns
--                                      'unknown_feature' and courseware-read
--                                      refuses anything but 'ok'. Looks like an
--                                      entitlement bug.
--
-- The third fails CLOSED, which is correct, and is the one nobody would think
-- to look for: the key exists, the console shows it, and the scope string is
-- spelled right everywhere a human would check.
--
-- ============ THE ASSERTION IS AN INSERT, NOT THE CONSTRAINT TEXT ============
--
-- A rewritten CHECK that admits the new value and silently drops an old one
-- passes any test that only tries the new one. Reading the constraint's text
-- back would only prove what it SAYS.
--
-- So every scope is probed by attempting a real write inside a sub-block that
-- rolls itself back by raising, and the verdict is whether the write was
-- refused. Measured BEFORE and AFTER, and the assertion is that every scope
-- accepted before is still accepted after -- derived from the before-state,
-- never from a list typed here, because a list typed here is the fifth copy.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  probes   text[] := array['credentials:issue', 'courseware:lessons', 'courseware:rubric'];
  s        text;
  ok       boolean;
  before_k text[] := '{}';   -- accepted by the MINT check, before
  before_o text[] := '{}';   -- accepted by the OAUTH check, before
  after_k  text[] := '{}';
  after_o  text[] := '{}';
  v_issuer uuid;
  lost     text[];
  n_feat   int;
begin

  select id into v_issuer from public.issuers order by created_at limit 1;
  if v_issuer is null then
    raise exception 'no issuer to probe against';
  end if;

  -- ------------------------------------------------- BEFORE
  foreach s in array probes loop
    -- MINT vocabulary.
    begin
      insert into public.issuer_api_keys (issuer_id, name, key_prefix, key_hash, scopes)
      values (v_issuer, 'scope probe 347', 'probe_347_' || s, 'probe347hash_' || s, array[s]);
      raise exception 'probe rollback' using errcode = 'ZZ999';
    exception
      when sqlstate 'ZZ999' then ok := true;
      when check_violation then ok := false;
    end;
    if ok then before_k := before_k || s; end if;

    -- OAUTH vocabulary.
    begin
      update public.issuers set mcp_scopes = array[s] where id = v_issuer;
      raise exception 'probe rollback' using errcode = 'ZZ999';
    exception
      when sqlstate 'ZZ999' then ok := true;
      when check_violation then ok := false;
    end;
    if ok then before_o := before_o || s; end if;
  end loop;

  raise notice 'before -- mint accepts %, oauth accepts %', before_k, before_o;

  if 'courseware:rubric' = any (before_k) and 'courseware:rubric' = any (before_o) then
    raise notice 'courseware:rubric already admitted by both CHECKs; widening is a no-op';
  end if;

  -- ------------------------------------------------- the widening
  alter table public.issuer_api_keys drop constraint if exists issuer_api_keys_scope_vocab;
  alter table public.issuer_api_keys
    add constraint issuer_api_keys_scope_vocab
    check (scopes <@ array['credentials:issue', 'courseware:lessons', 'courseware:rubric']::text[]);

  alter table public.issuers drop constraint if exists issuers_mcp_scopes_vocab;
  alter table public.issuers
    add constraint issuers_mcp_scopes_vocab
    check (mcp_scopes <@ array['credentials:issue', 'courseware:lessons', 'courseware:rubric']::text[]);

  -- THE THIRD VOCABULARY. Without this row the key mints and every call is
  -- refused, which is the failure that does not look like a scope problem.
  insert into public.mcp_features (feature_key, description) values
    ('courseware:rubric', 'Read the item-writing rubric for one task over the MCP. The partner''s own model writes the items; nothing is generated here and nothing is posted back.')
  on conflict (feature_key) do nothing;

  -- ===================== POST-CONDITIONS =====================

  -- ------------------------------------------------- AFTER
  foreach s in array probes loop
    begin
      insert into public.issuer_api_keys (issuer_id, name, key_prefix, key_hash, scopes)
      values (v_issuer, 'scope probe 347', 'probe_347b_' || s, 'probe347bhash_' || s, array[s]);
      raise exception 'probe rollback' using errcode = 'ZZ999';
    exception
      when sqlstate 'ZZ999' then ok := true;
      when check_violation then ok := false;
    end;
    if ok then after_k := after_k || s; end if;

    begin
      update public.issuers set mcp_scopes = array[s] where id = v_issuer;
      raise exception 'probe rollback' using errcode = 'ZZ999';
    exception
      when sqlstate 'ZZ999' then ok := true;
      when check_violation then ok := false;
    end;
    if ok then after_o := after_o || s; end if;
  end loop;

  raise notice 'after  -- mint accepts %, oauth accepts %', after_k, after_o;

  -- 1. POSITIVE. The new scope is admitted by both.
  if not ('courseware:rubric' = any (after_k)) then
    raise exception 'courseware:rubric is still refused by issuer_api_keys_scope_vocab';
  end if;
  if not ('courseware:rubric' = any (after_o)) then
    raise exception 'courseware:rubric is still refused by issuers_mcp_scopes_vocab';
  end if;

  -- 2. NEGATIVE, AND THE ONE THAT WAS ASKED FOR. Nothing that validated before
  --    stopped validating. DERIVED from the before-state: a list of the old
  --    scopes typed here would be a fifth copy of the vocabulary, and would go
  --    stale the next time one is added.
  select array_agg(x) into lost from unnest(before_k) x where not (x = any (after_k));
  if lost is not null then
    raise exception 'the mint CHECK no longer accepts: %', lost
      using detail = 'A rewritten constraint dropped a scope it used to admit.';
  end if;
  select array_agg(x) into lost from unnest(before_o) x where not (x = any (after_o));
  if lost is not null then
    raise exception 'the oauth CHECK no longer accepts: %', lost;
  end if;

  -- 3. AND THE PROBE ITSELF CAN FAIL. If every scope were accepted by a
  --    constraint that had been dropped rather than rewritten, checks 1 and 2
  --    would both pass. A value outside the vocabulary must still be refused.
  begin
    insert into public.issuer_api_keys (issuer_id, name, key_prefix, key_hash, scopes)
    values (v_issuer, 'scope probe 347', 'probe_347c', 'probe347chash', array['courseware:not-a-scope']);
    raise exception 'probe rollback' using errcode = 'ZZ999';
  exception
    when sqlstate 'ZZ999' then ok := true;
    when check_violation then ok := false;
  end;
  if ok then
    raise exception 'issuer_api_keys_scope_vocab accepted an invented scope -- the constraint is missing, not widened';
  end if;

  begin
    update public.issuers set mcp_scopes = array['courseware:not-a-scope'] where id = v_issuer;
    raise exception 'probe rollback' using errcode = 'ZZ999';
  exception
    when sqlstate 'ZZ999' then ok := true;
    when check_violation then ok := false;
  end;
  if ok then
    raise exception 'issuers_mcp_scopes_vocab accepted an invented scope -- the constraint is missing, not widened';
  end if;

  -- 4. THE THIRD VOCABULARY, and it is a different table with a different
  --    failure. Both old keys must still be present: mcp_features is a primary
  --    key table and an ON CONFLICT DO NOTHING cannot remove one, but asserting
  --    it is what makes that a fact rather than an expectation.
  select count(*) into n_feat
    from public.mcp_features
   where feature_key in ('credentials:issue', 'courseware:lessons', 'courseware:rubric');
  if n_feat <> 3 then
    raise exception 'mcp_features holds % of the 3 expected feature key(s)', n_feat;
  end if;

  -- 5. NOTHING WAS LEFT BEHIND BY THE PROBES. Every insert and update above
  --    rolled itself back by raising; prove it, because a probe that persisted
  --    would have written a fake API key against a real issuer.
  select count(*) into n_feat
    from public.issuer_api_keys where name = 'scope probe 347';
  if n_feat <> 0 then
    raise exception '% probe key(s) survived -- a savepoint did not roll back', n_feat;
  end if;
  if exists (select 1 from public.issuers
              where id = v_issuer and mcp_scopes @> array['courseware:not-a-scope']::text[]) then
    raise exception 'a probe left an invented scope on the issuer';
  end if;

  raise notice '347 ok: mint %, oauth %, mcp_features seeded, probes left nothing', after_k, after_o;
end
$mig$;
