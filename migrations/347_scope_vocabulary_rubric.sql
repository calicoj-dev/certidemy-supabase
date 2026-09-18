-- 347_scope_vocabulary_rubric.sql
--
-- Admit `courseware:rubric` to the scope vocabulary. BOTH of it.
--
-- ============ THIS FILE ABORTED ONCE, AND THE INVENTORY WAS WRONG ==========
--
-- The first version widened THREE things and died on
--
--   column "mcp_scopes" of relation "issuers" does not exist
--
-- It does not. Migration 331 retired it when grant-by-default replaced it, and
-- recorded why: "a column that must stay empty to be correct is a trap for
-- whoever sets it next." The constraint `issuers_mcp_scopes_vocab` went with
-- the column, as Postgres drops a CHECK when the column it depends on is
-- dropped -- confirmed against pg_catalog, not inferred:
--
--   pg_constraint on public.issuers matching '%scope%'   -> nothing
--   pg_attribute  on public.issuers matching '%scope%'   -> nothing
--   issuer_api_keys_scope_vocab                          -> CHECK ((scopes <@
--                                                           ARRAY['credentials:issue',
--                                                           'courseware:lessons']))
--
-- THE MISS WAS READING 329 AND INFERRING THE COLUMN. A migration describes an
-- INTENTION at a moment; pg_catalog describes the database. That is the same
-- shape as reading the next-free migration number from a note instead of the
-- folder, and the same answer: ask the catalog.
--
-- ============ SO THERE ARE TWO VOCABULARIES, NOT THREE ============
--
--   issuer_api_keys_scope_vocab   what may be MINTED           (322)
--   public.mcp_features           what may be USED at request  (331)
--                                 time, on BOTH routes
--
-- The second covers the OAuth route as well as the API-key route, checked
-- against pg_proc rather than assumed: `mcp.resolve_oauth_caller` references
-- the feature tables and mentions `mcp_scopes` nowhere. So the entitlement
-- question has ONE answer for both ways in, which is a better design than the
-- three-way split this file first described.
--
-- The two still fail differently, and only the first looks like a scope problem:
--
--   missing from the mint CHECK   400 at key creation, naming the scope.
--   missing from mcp_features     THE KEY MINTS AND EVERY CALL IS REFUSED.
--                                 mcp.feature_status returns 'unknown_feature',
--                                 courseware-read refuses anything but 'ok'.
--                                 Reads as an entitlement bug, and the scope
--                                 string is spelled correctly everywhere a
--                                 human would think to look.
--
-- ============ THE ASSERTION IS A WRITE, NOT THE CONSTRAINT TEXT ============
--
-- A rewritten CHECK that admits the new value and silently drops an old one
-- passes any test that only tries the new one, and reading the constraint back
-- would only prove what it SAYS. So every scope is probed by attempting a real
-- insert inside a sub-block that rolls itself back by raising, before and
-- after, and the verdict is whether the write was refused.
--
-- The negative half is DERIVED from the before-state rather than from a list
-- typed here, because a list typed here would be one more copy of the
-- vocabulary and would go stale the next time a scope is added.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  probes   text[] := array['credentials:issue', 'courseware:lessons', 'courseware:rubric'];
  s        text;
  ok       boolean;
  before_k text[] := '{}';
  after_k  text[] := '{}';
  v_issuer uuid;
  lost     text[];
  n        int;
begin

  -- ------------------------------------------------- pre-conditions
  -- THE INVENTORY IS ASSERTED, NOT ASSUMED. If `issuers.mcp_scopes` ever comes
  -- back there is a third vocabulary again and this file's header is wrong;
  -- whoever re-adds it should be told by this migration rather than by a
  -- partner whose chat client cannot read a lesson.
  select count(*) into n
    from information_schema.columns
   where table_schema = 'public' and table_name = 'issuers' and column_name = 'mcp_scopes';
  if n <> 0 then
    raise exception 'issuers.mcp_scopes exists again -- there is a third scope vocabulary and this migration does not widen it'
      using hint = 'Re-read the header. 331 retired this column; if it is back, its CHECK needs the new scope too.';
  end if;

  select count(*) into n
    from information_schema.tables
   where table_schema = 'public' and table_name = 'mcp_features';
  if n <> 1 then
    raise exception 'public.mcp_features does not exist -- 331 has not run';
  end if;

  select id into v_issuer from public.issuers order by created_at limit 1;
  if v_issuer is null then
    raise exception 'no issuer to probe against';
  end if;

  -- ------------------------------------------------- BEFORE
  foreach s in array probes loop
    begin
      insert into public.issuer_api_keys (issuer_id, name, key_prefix, key_hash, scopes)
      values (v_issuer, 'scope probe 347', 'probe_347_' || s, 'probe347hash_' || s, array[s]);
      raise exception 'probe rollback' using errcode = 'ZZ999';
    exception
      when sqlstate 'ZZ999' then ok := true;
      when check_violation then ok := false;
    end;
    if ok then before_k := before_k || s; end if;
  end loop;
  raise notice 'before -- the mint CHECK accepts %', before_k;

  -- ------------------------------------------------- the widening
  alter table public.issuer_api_keys drop constraint if exists issuer_api_keys_scope_vocab;
  alter table public.issuer_api_keys
    add constraint issuer_api_keys_scope_vocab
    check (scopes <@ array['credentials:issue', 'courseware:lessons', 'courseware:rubric']::text[]);

  -- THE SECOND VOCABULARY. Without this row the key mints and every call is
  -- refused, on both the API-key route and the OAuth one.
  insert into public.mcp_features (feature_key, description) values
    ('courseware:rubric', 'Read the item-writing rubric for one task over the MCP. The partner''s own model writes the items; nothing is generated here and nothing is posted back.')
  on conflict (feature_key) do nothing;

  -- ===================== POST-CONDITIONS =====================

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
  end loop;
  raise notice 'after  -- the mint CHECK accepts %', after_k;

  -- 1. POSITIVE.
  if not ('courseware:rubric' = any (after_k)) then
    raise exception 'courseware:rubric is still refused by issuer_api_keys_scope_vocab';
  end if;

  -- 2. NEGATIVE. Nothing that validated before stopped validating, derived from
  --    the before-state.
  select array_agg(x) into lost from unnest(before_k) x where not (x = any (after_k));
  if lost is not null then
    raise exception 'the mint CHECK no longer accepts: %', lost
      using detail = 'A rewritten constraint dropped a scope it used to admit.';
  end if;

  -- 3. AND THE PROBE CAN FAIL. A constraint that had been DROPPED rather than
  --    rewritten would satisfy 1 and 2 -- every scope accepted, none lost.
  begin
    insert into public.issuer_api_keys (issuer_id, name, key_prefix, key_hash, scopes)
    values (v_issuer, 'scope probe 347', 'probe_347c', 'probe347chash', array['courseware:not-a-scope']);
    raise exception 'probe rollback' using errcode = 'ZZ999';
  exception
    when sqlstate 'ZZ999' then ok := true;
    when check_violation then ok := false;
  end;
  if ok then
    raise exception 'the mint CHECK accepted an invented scope -- the constraint is missing, not widened';
  end if;

  -- 4. THE SECOND VOCABULARY, and both old keys must survive it.
  select count(*) into n
    from public.mcp_features
   where feature_key in ('credentials:issue', 'courseware:lessons', 'courseware:rubric');
  if n <> 3 then
    raise exception 'mcp_features holds % of the 3 expected feature key(s)', n;
  end if;

  -- 5. THE PROBES LEFT NOTHING. Each rolled itself back by raising; a probe
  --    that persisted would have written a fake API key against a real issuer.
  select count(*) into n from public.issuer_api_keys where name = 'scope probe 347';
  if n <> 0 then
    raise exception '% probe key(s) survived -- a sub-block did not roll back', n;
  end if;

  raise notice '347 ok: mint accepts %, mcp_features seeded, probes left nothing', after_k;
end
$mig$;
