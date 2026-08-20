// POST /functions/v1/upload-achievement-image
//
// multipart/form-data: achievement_id=<uuid>, file=<badge.png>
// Auth: Bearer JWT -- MUST be platform_admin.
//
// Uploads badge artwork for a partner achievement and points
// achievements.image_path at it.
//
// ============================== WHY A SPEC AND NOT A RESIZE ================
//
// A 3000x400 banner cannot be rescued by scaling. Squashed to square the logo
// distorts; letterboxed, the content occupies a fraction of a 60px badge slot
// and reads as a smear. Aspect ratio is the failure and no resize repairs it.
//
// A partner who uploads a banner needs to be told, with the actual dimensions
// in the message, rather than silently handed a squashed badge they never
// approved and will see on LinkedIn.
//
// Oversized SQUARE artwork is a different case and is simply accepted up to
// 1024px -- browsers downscale that well, and the existing Certidemy badges are
// 501x501 against a brief of "must read at 60px".
//
// ============================== PNG ONLY, FOR NOW ==========================
//
// The badges bucket is PUBLIC, because a badge is referenced by image.id inside
// a signed credential and every consuming platform loads it anonymously.
//
// An SVG can contain <script>. Serving partner-supplied SVG from a domain we
// control is an XSS vector that needs a real sanitiser, not a regex. PNG has no
// equivalent. The bucket permits image/svg+xml so that capability can be turned
// on later; this endpoint does not accept it yet.
//
// ============================== MAGIC BYTES, NOT HEADERS ===================
//
// The content-type on an upload is whatever the client claims. Dimensions and
// format are read from the file's own bytes: the 8-byte PNG signature, then the
// IHDR chunk. A file that says image/png and is not one is rejected here rather
// than discovered when a bake produces a corrupt image.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_BYTES = 512 * 1024;
const MIN_PX = 256;
const MAX_PX = 1024;
/** How far from square a badge may be. 5% lets a 500x512 through and stops a
 *  banner. */
const ASPECT_TOLERANCE = 0.05;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const STORAGE_PUBLIC_BASE =
  "https://pctynukndxnmnxiqpgck.supabase.co/storage/v1/object/public/badges";

/**
 * Read width and height from a PNG's own bytes.
 *
 * The signature is 8 bytes; IHDR must be the FIRST chunk, so width and height
 * are big-endian uint32s at offsets 16 and 20. Anything that does not match
 * this layout is not a PNG, whatever it claims to be.
 */
function readPng(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return null;
  }
  // bytes 12..15 must spell IHDR
  if (
    bytes[12] !== 0x49 || bytes[13] !== 0x48 ||
    bytes[14] !== 0x44 || bytes[15] !== 0x52
  ) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

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

    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new HttpError(400, "expected multipart/form-data with achievement_id and file");
    }

    const achievementId = String(form.get("achievement_id") ?? "").trim();
    const file = form.get("file");

    if (!achievementId || !UUID_RE.test(achievementId)) {
      throw new HttpError(400, "valid achievement_id required");
    }
    if (!(file instanceof File)) {
      throw new HttpError(400, "file required");
    }
    if (file.size > MAX_BYTES) {
      throw new HttpError(
        400,
        `file is ${Math.round(file.size / 1024)} KB; the limit is ${MAX_BYTES / 1024} KB. ` +
          `A badge that reads at 60px is nowhere near that large.`,
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const png = readPng(bytes);
    if (!png) {
      throw new HttpError(
        400,
        "not a PNG. SVG is not accepted yet: the badges bucket is public and " +
          "an SVG can carry a script, which needs a sanitiser rather than a " +
          "check. Upload a PNG.",
      );
    }

    const { width, height } = png;
    const ratio = width / height;
    if (Math.abs(ratio - 1) > ASPECT_TOLERANCE) {
      throw new HttpError(
        400,
        `badge is ${width}x${height}. It must be square (within 5%). ` +
          `A wide image cannot be rescued by scaling -- squashed it distorts, ` +
          `letterboxed it disappears at the 60px size these are displayed at.`,
      );
    }
    if (width < MIN_PX || height < MIN_PX) {
      throw new HttpError(
        400,
        `badge is ${width}x${height}; the minimum is ${MIN_PX}x${MIN_PX}. ` +
          `Smaller artwork will look soft everywhere it is enlarged.`,
      );
    }
    if (width > MAX_PX || height > MAX_PX) {
      throw new HttpError(
        400,
        `badge is ${width}x${height}; the maximum is ${MAX_PX}x${MAX_PX}. ` +
          `Export it smaller -- this file is fetched on every badge download.`,
      );
    }

    // ---- the achievement and its issuer ---------------------------------
    const { data: ach, error: aErr } = await svc
      .from("achievements")
      .select("id, code, name, issuer_id, certification_id")
      .eq("id", achievementId)
      .maybeSingle();
    if (aErr) throw new Error(`achievement lookup: ${aErr.message}`);
    if (!ach) throw new HttpError(404, "achievement not found");
    if (ach.certification_id) {
      throw new HttpError(
        409,
        "this achievement is backed by a Certidemy certification; its badge " +
          "comes from _shared/badges.ts, not from storage",
      );
    }

    const { data: issuer } = await svc
      .from("issuers")
      .select("slug")
      .eq("id", ach.issuer_id)
      .maybeSingle();
    if (!issuer) throw new HttpError(404, "issuer not found");

    // Path is derived, never client-supplied: the constraint added in 238
    // pins image_path to this bucket, and a caller-chosen key would be the
    // one way to get something else in there.
    const objectPath = `${issuer.slug}/${ach.code}.png`;

    const { error: upErr } = await svc.storage
      .from("badges")
      .upload(objectPath, bytes, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "public, max-age=31536000, immutable",
      });
    if (upErr) {
      console.error("badge upload failed", upErr);
      throw new HttpError(500, "failed to store the badge");
    }

    const publicUrl = `${STORAGE_PUBLIC_BASE}/${objectPath}`;

    const { error: setErr } = await svc
      .from("achievements")
      .update({ image_path: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", ach.id);
    if (setErr) {
      // The object is in the bucket but nothing points at it. Harmless, and a
      // retry overwrites it -- far better than a row pointing at an object
      // that failed to upload.
      console.error("image_path update failed", setErr);
      throw new HttpError(500, "badge stored but not linked; retry the upload");
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "upload_achievement_image",
      target_type: "achievement",
      target_id: ach.id,
      reason: null,
      metadata: {
        issuer_slug: issuer.slug,
        code: ach.code,
        object_path: objectPath,
        width,
        height,
        bytes: bytes.length,
      },
    });

    return jsonResponse({
      ok: true,
      achievement: { id: ach.id, code: ach.code, name: ach.name },
      image: {
        url: publicUrl,
        width,
        height,
        bytes: bytes.length,
      },
      note:
        "Credentials issued from now on carry this as image.id. Credentials " +
        "already signed keep the snapshot they were signed with -- their " +
        "signatures are untouched.",
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
