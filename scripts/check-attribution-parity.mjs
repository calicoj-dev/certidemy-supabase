#!/usr/bin/env node
/**
 * check-attribution-parity.mjs - does a quotation attributed in English carry
 * the same attribution in Spanish and Portuguese?
 *
 * READ-ONLY. --cert, --json, --verbose. Unknown flags exit 2. No --apply.
 *
 * ============ WHAT THIS CLOSES ============
 *
 * IP-POSITION section 6, as amended 2026-09-17, permits clause text that is
 * QUOTED AND ATTRIBUTED. Section 6 also records, plainly, that attribution is
 * machine-enforced in English and EDITORIAL in the other two languages, because
 * the leak index is built from the English editions and a translated row
 * measures zero by construction.
 *
 * That gap was not theoretical for long. Three translations dropped the clause
 * designation from a lead-in the same day the rule was written -- isms-ia-02-06
 * pt-BR lost "clause 9.2.2", and isms-ia-04-07 lost "ISO/IEC 27001:2022" in
 * BOTH languages -- so a quotation attributed in English was bare in two of
 * three languages, which the amended rule does not permit. They were found by a
 * language-guard tie, which is to say by accident.
 *
 * ============ WHY THIS PART *IS* CHECKABLE ============
 *
 * Section 6's argument for "editorial" is that the detector cannot read
 * translated ISO text. True -- but attribution is not ISO text. An attribution
 * is a DESIGNATION, and a designation is language-invariant:
 *
 *     ISO/IEC 27001:2022      identical in all three
 *     9.2.2                   identical in all three
 *     Annex A / Anexo A       the letter survives; only the noun translates
 *
 * So the ADDRESS half of the editorial gap closes completely, mechanically, and
 * without holding a single translated edition of any standard. What stays
 * editorial is everything else about a translation -- whether it says what the
 * English says. This checks one property, and says so.
 *
 * ============ HOW IT DECIDES ============
 *
 * For every blockquote line in an English body that `isAttributed` accepts, the
 * addresses visible on that line or its lead-in are extracted. The sibling rows
 * are then examined AT THE SAME COORDINATE -- block index and line-within-block,
 * the alignment every splice in this repo already relies on -- and must carry
 * the same address set.
 *
 * A missing address is a finding. An EXTRA address in a translation is not: a
 * translator may legitimately name the clause where the English left it to the
 * paragraph above.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { reviewBlocks as blocks, solid } from "./lib/guide-runs.mjs";
import { isQuoteLine, isAttributed } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--cert", "--json", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const ONLY = arg("cert", "");
const JSON_OUT = arg("json", "");
const VERBOSE = process.argv.includes("--verbose");

/* ---------------------------------------------- the invariant address forms */
const STD_RE = /ISO(?:\/IEC)?\s*(\d{4,5})(?:\s*:\s*(\d{4}))?/gi;
const CLAUSE_RE = /\b(\d+(?:\.\d+)+)\b/g;
const ANNEX_RE = /\b(?:annexe?|anexo|anejo)\s+([A-Z])\b/gi;

/** The set of language-invariant attribution tokens in a string. */
export function addressesIn(text) {
  const s = String(text || "");
  const out = new Set();
  for (const m of s.matchAll(STD_RE)) out.add("STD:" + m[1] + (m[2] ? ":" + m[2] : ""));
  for (const m of s.matchAll(CLAUSE_RE)) out.add("CL:" + m[1]);
  for (const m of s.matchAll(ANNEX_RE)) out.add("ANNEX:" + m[1].toUpperCase());
  return out;
}

/* ============ POSITIVE CONTROL. A check that cannot fire is not a check. ====
 *
 * Two fixtures: a sibling that dropped the designation MUST be flagged, and a
 * sibling that kept it must not. Without the second, a comparator that flags
 * everything would pass the first. */
function controls() {
  const bad = [];
  const en = "Clause 9.2.2 of ISO/IEC 27001:2022 says:";
  const dropped = "A clausula diz:";
  const kept = "A clausula 9.2.2 da ISO/IEC 27001:2022 diz:";
  const want = addressesIn(en);
  const missingFromDropped = [...want].filter((a) => !addressesIn(dropped).has(a));
  const missingFromKept = [...want].filter((a) => !addressesIn(kept).has(a));
  if (missingFromDropped.length === 0) bad.push("a sibling that dropped the designation was NOT flagged");
  if (missingFromKept.length !== 0) bad.push("a sibling that KEPT the designation was flagged: " + missingFromKept.join(","));
  /* And the annex form across languages. */
  if (!addressesIn("Anexo A").has("ANNEX:A")) bad.push("Spanish/Portuguese `Anexo A` not recognised");
  if (!addressesIn("Annex A").has("ANNEX:A")) bad.push("English `Annex A` not recognised");
  /* A bare number must not be read as a clause address. */
  if (addressesIn("there were 12 findings").size !== 0) bad.push("a bare integer was read as an address");
  return bad;
}

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
async function raw(p, extra = {}) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: { ...H, ...extra }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 180));
      return { rows: JSON.parse(t), range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw last;
}
/* Pages and asserts against count=exact. CLAUDE.md: a PostgREST read without
 * both is a floor, not a total. */
async function all(p) {
  const PAGE = 500, out = [];
  for (let from = 0; ; from += PAGE) {
    const { rows } = await raw(p, { Range: from + "-" + (from + PAGE - 1) });
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  const { range } = await raw(p + (p.includes("?") ? "&" : "?") + "limit=1", { Prefer: "count=exact" });
  const total = Number(String(range || "").split("/")[1]);
  if (!Number.isFinite(total)) throw new Error("no exact count for " + p);
  if (out.length !== total) throw new Error("PAGINATION SHORT: " + out.length + " of " + total);
  return out;
}

const ctl = controls();
console.log("");
console.log("CONTROLS");
if (ctl.length) {
  for (const c of ctl) console.log("  FAIL  " + c);
  console.log("");
  console.log("The comparator failed its own fixtures. Checking nothing.");
  process.exit(1);
}
console.log("  ok    5 fixture(s): a dropped designation fires, a kept one does not,");
console.log("        Annex/Anexo both recognised, a bare integer is not an address");

/** A quote line's content with its leading marker removed; "" for a bare `>`. */
const STRIP_MARK = (t) => String(t).trim().replace(/^>+/, "").trim();

/** Lead-in for a quote at (bi, li): nearest preceding non-blank, non-quote line. */
function leadInAt(sol, li) {
  for (let k = li - 1; k >= 0; k--) {
    const t = sol[k].text.trim();
    if (t && !isQuoteLine(sol[k].text)) return sol[k].text;
  }
  return "";
}

const certs = await all("certifications?select=id,code");
const wanted = certs.filter((c) => !ONLY || c.code === ONLY);
const findings = [];
let quotesChecked = 0, groupsChecked = 0;

for (const c of wanted) {
  const mods = await all("modules?select=id&certification_id=eq." + c.id);
  if (!mods.length) continue;
  const rows = await all("lessons?select=id,slug,language,lesson_group_id,content_md&module_id=in.(" +
    mods.map((m) => m.id).join(",") + ")");
  const byGroup = new Map();
  for (const r of rows) {
    const k = r.lesson_group_id ?? "SOLO:" + r.id;
    byGroup.set(k, (byGroup.get(k) ?? []).concat([r]));
  }
  for (const [, members] of byGroup) {
    const en = members.find((m) => m.language === "en");
    const sibs = members.filter((m) => m.language !== "en");
    if (!en || !sibs.length) continue;
    groupsChecked++;
    const enBlocks = blocks(en.content_md);
    for (let bi = 0; bi < enBlocks.length; bi++) {
      const sol = solid(enBlocks[bi]);
      for (let li = 0; li < sol.length; li++) {
        if (!isQuoteLine(sol[li].text)) continue;
        const lead = leadInAt(sol, li);
        if (!isAttributed(sol[li].text, lead)) continue;
        const want = addressesIn(sol[li].text + " " + lead);
        if (want.size === 0) continue;
        quotesChecked++;
        for (const sib of sibs) {
          const sb = blocks(sib.content_md);
          if (!sb[bi]) continue;
          const ssol = solid(sb[bi]);
          if (!ssol[li]) continue;
          const have = addressesIn(ssol[li].text + " " + leadInAt(ssol, li));
          const missing = [...want].filter((a) => !have.has(a));
          if (missing.length) {
            findings.push({
              cert: c.code, slug: en.slug, language: sib.language, block: bi, line: li,
              missing, en_lead: lead.trim().slice(0, 130),
              sib_lead: leadInAt(ssol, li).trim().slice(0, 130),
            });
          }
        }
      }
    }
  }
}

/* ============ MARKER PARITY, AND IT IS THE SHARPER PROPERTY ============
 *
 * The address check below found isms-ia-01-03 only SIDEWAYS: it reported a
 * missing designation, and the real defect was that both translations had lost
 * the `>` blockquote markers, so clause 4.6's two sentences are a set-off
 * quotation in English and ORDINARY PROSE in Spanish and Portuguese. The
 * address was present; the quotation was not.
 *
 * A check that finds something by accident will miss the next one. `>` is
 * markup rather than language, so this is even more invariant than a
 * designation, and it tests the property section 6 actually turns on: is the
 * reader shown that these words are someone else's?
 */
const markerFindings = [];
let markersChecked = 0;
for (const c of wanted) {
  const mods = await all("modules?select=id&certification_id=eq." + c.id);
  if (!mods.length) continue;
  const rows = await all("lessons?select=id,slug,language,lesson_group_id,content_md&module_id=in.(" +
    mods.map((m) => m.id).join(",") + ")");
  const byGroup = new Map();
  for (const r of rows) {
    const k = r.lesson_group_id ?? "SOLO:" + r.id;
    byGroup.set(k, (byGroup.get(k) ?? []).concat([r]));
  }
  for (const [, members] of byGroup) {
    const en = members.find((m) => m.language === "en");
    const sibs = members.filter((m) => m.language !== "en");
    if (!en || !sibs.length) continue;
    const enBlocks = blocks(en.content_md);
    for (let bi = 0; bi < enBlocks.length; bi++) {
      const sol = solid(enBlocks[bi]);
      for (let li = 0; li < sol.length; li++) {
        if (!isQuoteLine(sol[li].text)) continue;
        if (!STRIP_MARK(sol[li].text)) continue;              // a bare `>` spacer
        markersChecked++;
        for (const sib of sibs) {
          const sb = blocks(sib.content_md);
          if (!sb[bi]) continue;
          const ssol = solid(sb[bi]);
          if (!ssol[li]) continue;
          if (!isQuoteLine(ssol[li].text)) {
            markerFindings.push({
              cert: c.code, slug: en.slug, language: sib.language, block: bi, line: li,
              en: sol[li].text.trim().slice(0, 110),
              sib: ssol[li].text.trim().slice(0, 110),
            });
          }
        }
      }
    }
  }
}

console.log("");
console.log("MARKER PARITY -- an English blockquote must be a blockquote in both siblings");
console.log("  English blockquote lines compared  " + markersChecked);
console.log("  siblings that lost the marker      " + markerFindings.length);
if (markerFindings.length) {
  const byCert = new Map();
  for (const f of markerFindings) byCert.set(f.cert, (byCert.get(f.cert) ?? 0) + 1);
  console.log("");
  for (const [k, v] of [...byCert.entries()].sort()) console.log("    " + k.padEnd(10) + v);
  console.log("");
  for (const f of markerFindings.slice(0, VERBOSE ? 999 : 10)) {
    console.log("  " + f.slug + " / " + f.language + "  b" + f.block + "l" + f.line);
    console.log("      en : " + f.en);
    console.log("      sib: " + f.sib);
  }
  if (!VERBOSE && markerFindings.length > 10) {
    console.log("  ... and " + (markerFindings.length - 10) + " more (--verbose)");
  }
  process.exitCode = 1;
} else {
  console.log("  Every set-off quotation in English is set off in both siblings.");
}

console.log("");
console.log("ATTRIBUTION PARITY");
console.log("  lesson groups compared      " + groupsChecked);
console.log("  attributed English quotes    " + quotesChecked);
console.log("  siblings missing an address  " + findings.length);
console.log("");

if (findings.length === 0) {
  console.log("  Every address attributing an English quotation is present in both siblings.");
} else {
  const byCert = new Map();
  for (const f of findings) byCert.set(f.cert, (byCert.get(f.cert) ?? 0) + 1);
  for (const [k, v] of [...byCert.entries()].sort()) console.log("    " + k.padEnd(10) + v);
  console.log("");
  for (const f of findings.slice(0, VERBOSE ? 999 : 15)) {
    console.log("  " + f.slug + " / " + f.language + "  b" + f.block + "l" + f.line +
      "   missing " + f.missing.join(", "));
    console.log("      en : " + f.en_lead);
    console.log("      sib: " + f.sib_lead);
  }
  if (!VERBOSE && findings.length > 15) console.log("  ... and " + (findings.length - 15) + " more (--verbose)");
  process.exitCode = 1;
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ groups: groupsChecked, quotes: quotesChecked, findings, markers_checked: markersChecked, marker_findings: markerFindings }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + JSON_OUT);
}
