-- 242_achievement_edits_bump_material.sql
--
-- Editing an achievement changes every credential that points at it. Those
-- credentials must be re-dated.
--
-- ============================ THE BUG ====================================
--
-- Observed on 2026-08-21. An achievement was renamed. The already-issued
-- credential immediately served the NEW name -- and its proof still claimed
-- material_updated_at = 01:28:29, set hours earlier by an unrelated change.
--
-- Two materially different documents, one version timestamp. That is precisely
-- what material_updated_at exists to prevent, and the anchor leaf silently
-- stopped matching at the same moment.
--
-- The signature still verified, because open-badge signs at READ time over
-- whatever bytes exist. Nothing failed loudly. That is the dangerous part.
--
-- ============================ THERE IS NO FROZEN COPY ====================
--
-- Worth stating plainly, because the opposite was believed and written down.
--
-- buildCredential embeds the achievement object, but that object is built
-- FRESH on every request by loadAchievement. Nothing about the achievement is
-- snapshotted onto the credential row. An edit propagates to every credential
-- immediately.
--
-- For certifications this is deliberate and documented in loadAchievement: the
-- NAME comes from the live row so a renamed product does not stamp a stale
-- name onto credentials. Only `domains` comes from the JTA snapshot. The same
-- live-read applies to partner achievements, which is correct -- and means the
-- bump has to be a trigger, because the credential row itself never changes.
--
-- ============================ WHICH COLUMNS ==============================
--
-- Only those that appear in the emitted document:
--
--   name, description, achievement_type, criteria_narrative, criteria_url,
--   image_path, default_validity_days
--
-- NOT status: archiving changes whether the PUBLIC DEFINITION is served, not
-- what a credential says. NOT code: immutable once a credential exists. NOT
-- tags or authoring_depth: neither is emitted.
--
-- Getting this list wrong in either direction is expensive. Too narrow and a
-- document changes under a stale timestamp, which is this bug. Too broad and
-- every credential gets re-dated and re-anchored for an edit nobody can see.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. achievements
create or replace function public.achievement_bump_credential_material()
returns trigger
language plpgsql
as $function$
begin
  -- Only the columns that reach the emitted document.
  if new.name                  is distinct from old.name
     or new.description        is distinct from old.description
     or new.achievement_type   is distinct from old.achievement_type
     or new.criteria_narrative is distinct from old.criteria_narrative
     or new.criteria_url       is distinct from old.criteria_url
     or new.image_path         is distinct from old.image_path
     or new.default_validity_days is distinct from old.default_validity_days
  then
    update public.credentials
    set material_updated_at = now()
    where achievement_id = new.id;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_achievement_bump_credential_material on public.achievements;
create trigger trg_achievement_bump_credential_material
  after update on public.achievements
  for each row execute function public.achievement_bump_credential_material();

-- ============================================================ 2. alignments
-- Alignments are emitted as alignment[] inside the achievement object, so a
-- change to one changes every credential rendering it. Fires on INSERT and
-- DELETE too: update-partner-achievement replaces the whole set by
-- delete-then-insert, and neither half is an UPDATE.
create or replace function public.alignment_bump_credential_material()
returns trigger
language plpgsql
as $function$
declare
  v_achievement uuid;
begin
  v_achievement := coalesce(new.achievement_id, old.achievement_id);

  update public.credentials
  set material_updated_at = now()
  where achievement_id = v_achievement;

  return coalesce(new, old);
end;
$function$;

drop trigger if exists trg_alignment_bump_credential_material on public.achievement_alignments;
create trigger trg_alignment_bump_credential_material
  after insert or update or delete on public.achievement_alignments
  for each row execute function public.alignment_bump_credential_material();

-- ============================================================ 3. results
-- achievement_results become resultDescription[] in the same object.
create or replace function public.achievement_result_bump_credential_material()
returns trigger
language plpgsql
as $function$
declare
  v_achievement uuid;
begin
  v_achievement := coalesce(new.achievement_id, old.achievement_id);

  update public.credentials
  set material_updated_at = now()
  where achievement_id = v_achievement;

  return coalesce(new, old);
end;
$function$;

drop trigger if exists trg_achievement_result_bump_credential_material
  on public.achievement_results;
create trigger trg_achievement_result_bump_credential_material
  after insert or update or delete on public.achievement_results
  for each row execute function public.achievement_result_bump_credential_material();

-- ============================================================ 4. repair
-- The credential renamed before this trigger existed is serving a document its
-- proof timestamp does not describe. One row today; done as a set so it is
-- correct whatever the state turns out to be.
update public.credentials c
set material_updated_at = greatest(c.material_updated_at, a.updated_at)
from public.achievements a
where a.id = c.achievement_id
  and a.updated_at > c.material_updated_at;

commit;

-- Verification (run separately, one at a time):
--
--   select c.credential_code, c.material_updated_at, a.updated_at as achievement_updated
--   from public.credentials c join public.achievements a on a.id = c.achievement_id
--   where a.updated_at > c.material_updated_at;
--   -- ZERO rows. Any row here is a document whose proof lies about its version.
--
-- Prove the trigger. Note the timestamp, rename, note it again:
--
--   select material_updated_at from public.credentials
--   where credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P';
--
--   update public.achievements set name = name || ' '
--   where code = 'SCRUM-BOOTCAMP-2026-08';
--
--   select material_updated_at from public.credentials
--   where credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P';
--   -- MUST have moved.
--
-- Prove it does NOT fire on a column the document never carries:
--
--   select material_updated_at from public.credentials
--   where credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P';
--
--   update public.achievements set tags = array['x']
--   where code = 'SCRUM-BOOTCAMP-2026-08';
--
--   select material_updated_at from public.credentials
--   where credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P';
--   -- MUST be unchanged. A bump here would re-anchor every credential for an
--   -- edit nobody can see.
--
-- AFTER RUNNING: the served document's proof.created must match the row.
--
--   curl -s ".../credentials/SCRUM-BOOTCAMP-2-T7ZQ-755P?cb=1" | grep created
