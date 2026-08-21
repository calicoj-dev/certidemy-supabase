// POST /functions/v1/update-partner-achievement
//
// Body: { achievement_id, ...fields } | { achievement_id, action: "archive" | "activate" | "delete" }
// Auth: Bearer JWT -- platform_admin, or the team_admin of the owning company.
//
// Edits an achievement, or changes its lifecycle.
//
// ============================== WHAT AN EDIT CAN AND CANNOT BREAK =========
//
// buildCredential embeds a FROZEN COPY of the achievement inside
// credentialSubject, and that copy is signed. Thirty already-issued badges keep
// the name, criteria and alignments they were signed with, forever, regardless
// of what happens here.
//
// So an edit changes exactly two things: the live public definition at
// /achievements/<code>, and every credential issued FROM NOW ON. It cannot
// corrupt anything already issued.
//
// That is why this function does NOT lock an achievement once credentials
// exist. Locking would force a partner fixing a typo to create
// SCRUM-BOOTCAMP-2026-09-V2 and put that code in a permanent namespace, to
// protect credentials that were never at risk.
//
// ============================== WHAT IS ACTUALLY IMMUTABLE ===============
//
// The CODE, once any credential references it. It is the URL segment of a
// public definition that signed documents point at, and migration 231's
// trigger refuses to change it independently of this function. The check here
// exists to return a sentence rather than a trigger exception.
//
// ============================== DELETE vs ARCHIVE ========================
//
// credentials.achievement_id is ON DELETE RESTRICT, so Postgres already
// refuses to delete an achievement any credential points at. Delete is
// therefore only ever possible for one that was never used -- a typo, a draft,
// a duplicate -- and in that case it should free the code rather than leave
// litter in the namespace.
//
// Archive is for everything else: it stops new issuance and removes the public
// definition, while every credential ever issued keeps resolving. That
// behaviour depends on the publicDefinition flag in open-badge; before that fix
// archiving would have 500'd every credential from the achievement.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { requireIssuerAccess } from "../_shared/authorize.ts";

interface AlignmentIn {
  target_name?: string;
  target_url?: string;
  target_framework?: string;
  target_code?: string;
  target_description?: string;
  target_type?: string;
}

interface Body {
  achievement_id?: string;
  action?: string;
  name?: string;
  description?: string;
  achievement_type?: string;
  criteria_narrative?: string;
  criteria_url?: string;
  tags?: string[];
  default_validity_days?: number | null;
  /** Replaces the whole set when present. Omit to leave alignments alone. */
  alignments?: AlignmentIn[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TYPES = new Set([
  "Achievement", "Assessment", "Award", "Badge", "Certificate",
  "CertificateOfCompletion", "Certification", "Competency", "Course",
  "Diploma", "Fieldwork", "LearningProgram", "License", "Membership",
  "MicroCredential",
]);

/** Same list as create-partner-achievement. A name must not make a partner's
 *  claim read as ours, or as accredited by a body that has not accredited it. */
const FORBIDDEN_IN_NAME = [
  "certidemy", "certiglobal",
  "accredited by", "acreditado por", "acreditada por", "credenciado por",
  "ansi accredited", "iaf accredited", "ukas accredited",
  "iso 17024", "iso/iec 17024", "17024 accredited",
];

const MIN_CRITERIA = 20;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    const body = (await req.json()) as Body;
    const achievementId = body.achievement_id?.trim();
    const action = body.action?.trim().toLowerCase() ?? "update";

    if (!achievementId || !UUID_RE.test(achievementId)) {
      throw new HttpError(400, "valid achievement_id required");
    }
    if (!["update", "archive", "activate", "delete"].includes(action)) {
      throw new HttpError(400, 'action must be update, archive, activate or delete');
    }

    const { data: ach, error: aErr } = await svc
      .from("achievements")
      .select(
        "id, issuer_id, code, name, status, certification_id, criteria_narrative",
      )
      .eq("id", achievementId)
      .maybeSingle();
    if (aErr) throw new Error(`achievement lookup: ${aErr.message}`);
    if (!ach) throw new HttpError(404, "achievement not found");

    // A Certidemy scheme is not editable through the partner surface. Its
    // definition comes from the JTA pipeline, and a name typed into a form
    // would silently disagree with the blueprint it was projected from.
    if (ach.certification_id) {
      throw new HttpError(
        409,
        "this achievement is backed by a Certidemy certification and is " +
          "maintained through the certification pipeline, not here",
      );
    }

    await requireIssuerAccess(svc, actor, ach.issuer_id);

    // How many credentials point at it. Drives the delete refusal and the
    // sentence returned to the caller.
    const { count: issuedCount } = await svc
      .from("credentials")
      .select("id", { count: "exact", head: true })
      .eq("achievement_id", ach.id);
    const issued = issuedCount ?? 0;

    /* ------------------------------------------------------- lifecycle --- */

    if (action === "archive" || action === "activate") {
      const next = action === "archive" ? "archived" : "active";

      if (
        next === "active" &&
        (ach.criteria_narrative ?? "").trim().length < MIN_CRITERIA
      ) {
        throw new HttpError(
          400,
          `an active achievement needs a criteria narrative of at least ` +
            `${MIN_CRITERIA} characters`,
        );
      }

      const { error } = await svc
        .from("achievements")
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", ach.id);
      if (error) {
        console.error("status change failed", error);
        throw new HttpError(500, "failed to change the status");
      }

      await svc.from("admin_actions").insert({
        actor_user_id: actor,
        action: `${action}_partner_achievement`,
        target_type: "achievement",
        target_id: ach.id,
        reason: null,
        metadata: { code: ach.code, issued },
      });

      return jsonResponse({
        ok: true,
        status: next,
        code: ach.code,
        note: next === "archived"
          ? `The public definition is no longer served and no new credentials ` +
            `can be issued. The ${issued} already issued keep resolving.`
          : "The public definition is being served again.",
      });
    }

    if (action === "delete") {
      // credentials.achievement_id is ON DELETE RESTRICT, so the database
      // would refuse anyway. Checked here to return a sentence explaining what
      // to do instead of a foreign key violation.
      if (issued > 0) {
        throw new HttpError(
          409,
          `${issued} credential${issued === 1 ? "" : "s"} point at this ` +
            `achievement, so it cannot be deleted -- the credentials would ` +
            `have nothing to resolve against. Archive it instead: they keep ` +
            `working and no new ones can be issued.`,
        );
      }

      const { error } = await svc
        .from("achievements")
        .delete()
        .eq("id", ach.id);
      if (error) {
        console.error("delete failed", error);
        throw new HttpError(500, "failed to delete the achievement");
      }

      await svc.from("admin_actions").insert({
        actor_user_id: actor,
        action: "delete_partner_achievement",
        target_type: "achievement",
        target_id: ach.id,
        reason: null,
        metadata: { code: ach.code },
      });

      return jsonResponse({
        ok: true,
        deleted: true,
        code: ach.code,
        note: `The code "${ach.code}" is free again.`,
      });
    }

    /* ---------------------------------------------------------- update --- */

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      const v = body.name.trim();
      if (!v) throw new HttpError(400, "name cannot be empty");
      patch.name = v;
    }
    if (body.description !== undefined) {
      const v = body.description.trim();
      if (!v) throw new HttpError(400, "description cannot be empty");
      patch.description = v;
    }
    if (body.achievement_type !== undefined) {
      const v = body.achievement_type.trim();
      if (!TYPES.has(v) && !v.startsWith("ext:")) {
        throw new HttpError(400, "achievement_type is not a recognised value");
      }
      patch.achievement_type = v;
    }
    if (body.criteria_narrative !== undefined) {
      patch.criteria_narrative = body.criteria_narrative.trim() || null;
    }
    if (body.criteria_url !== undefined) {
      const v = body.criteria_url.trim();
      if (v && !v.startsWith("https://")) {
        throw new HttpError(400, "criteria_url must be https");
      }
      patch.criteria_url = v || null;
    }
    if (body.tags !== undefined) {
      patch.tags = Array.isArray(body.tags)
        ? body.tags.map((s) => String(s).trim()).filter(Boolean).slice(0, 32)
        : [];
    }
    if (body.default_validity_days !== undefined) {
      const v = body.default_validity_days;
      if (v !== null && (!Number.isInteger(v) || v < 1)) {
        throw new HttpError(400, "default_validity_days must be a positive integer");
      }
      patch.default_validity_days = v;
    }

    const nextName = (patch.name as string) ?? ach.name;
    const nextDesc = (patch.description as string) ?? "";
    const haystack = `${nextName} ${nextDesc}`.toLowerCase();
    const hit = FORBIDDEN_IN_NAME.find((w) => haystack.includes(w));
    if (hit) {
      throw new HttpError(
        400,
        `the name or description contains "${hit}", which would make this ` +
          `claim read as Certidemy's or as accredited`,
      );
    }

    // Still active after the edit? Then the criteria floor still applies.
    if (ach.status === "active") {
      const nextCriteria =
        (patch.criteria_narrative as string | null | undefined) ??
          ach.criteria_narrative ?? "";
      if (nextCriteria.trim().length < MIN_CRITERIA) {
        throw new HttpError(
          400,
          `an active achievement needs a criteria narrative of at least ` +
            `${MIN_CRITERIA} characters`,
        );
      }
    }

    const { error: upErr } = await svc
      .from("achievements")
      .update(patch)
      .eq("id", ach.id);
    if (upErr) {
      console.error("achievement update failed", upErr);
      throw new HttpError(500, "failed to update the achievement");
    }

    /* ---- alignments: replace the whole set, or leave it alone ----------- */
    let alignmentCount: number | null = null;
    if (body.alignments !== undefined) {
      const rows = (body.alignments ?? []).map((a, i) => {
        if (!a.target_name?.trim()) {
          throw new HttpError(400, `alignments[${i}]: target_name required`);
        }
        if (!a.target_url?.trim().startsWith("https://")) {
          throw new HttpError(400, `alignments[${i}]: target_url must be https`);
        }
        return {
          achievement_id: ach.id,
          target_name: a.target_name.trim(),
          target_url: a.target_url.trim(),
          target_framework: a.target_framework?.trim() || null,
          target_code: a.target_code?.trim() || null,
          target_description: a.target_description?.trim() || null,
          target_type: a.target_type?.trim() || null,
          order_index: i,
        };
      });

      // Delete-then-insert rather than diffing. Alignments have no identity a
      // caller carries -- the editor sends a list, not a set of edits -- and a
      // diff would be inventing one. Not transactional, but the only readers
      // are open-badge (which tolerates an empty list for a moment) and this
      // function.
      const { error: delErr } = await svc
        .from("achievement_alignments")
        .delete()
        .eq("achievement_id", ach.id);
      if (delErr) {
        console.error("alignment clear failed", delErr);
        throw new HttpError(500, "failed to replace the structure");
      }

      if (rows.length > 0) {
        const { error: insErr } = await svc
          .from("achievement_alignments")
          .insert(rows);
        if (insErr) {
          console.error("alignment insert failed", insErr);
          throw new HttpError(
            500,
            "the previous structure was cleared but the new one failed to " +
              "save. Re-submit it.",
          );
        }
      }
      alignmentCount = rows.length;

      await svc
        .from("achievements")
        .update({
          authoring_depth: rows.length > 0 ? "structured" : "simple",
        })
        .eq("id", ach.id);
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "update_partner_achievement",
      target_type: "achievement",
      target_id: ach.id,
      reason: null,
      metadata: {
        code: ach.code,
        issued,
        fields: Object.keys(patch).filter((k) => k !== "updated_at"),
        alignments: alignmentCount,
      },
    });

    return jsonResponse({
      ok: true,
      achievement: { id: ach.id, code: ach.code },
      issued,
      note: issued > 0
        ? `Updated. The ${issued} credential${issued === 1 ? "" : "s"} already ` +
          `issued keep the wording they were signed with; credentials issued ` +
          `from now on carry the new version.`
        : "Updated.",
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
