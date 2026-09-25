/**
 * sweep-class-histogram.mjs -- what ARE the members of each class?
 *
 * A count is read before it is reported. This prints the distinct detail
 * strings behind every class, most frequent first, so a class that turns out to
 * be one rule firing on a house convention is visible as such rather than as a
 * large number.
 *
 * READ-ONLY, no network, no credential. Unknown flags exit 2.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--top", "--class"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a.split("=")[0])) {
    console.error("unknown flag " + JSON.stringify(a) + " -- known: " + [...KNOWN].join(", "));
    process.exitCode = 2; process.exit();
  }
}
const arg = (n, d) => {
  const h = process.argv.slice(2).find((a) => a.startsWith(n + "="));
  return h ? h.slice(n.length + 1) : d;
};
const TOP = Number(arg("--top", "8"));
const ONLY = arg("--class", null);

const data = JSON.parse(readFileSync(join(ROOT, "ITEM-QUALITY-SWEEP.json"), "utf8"));

const byClass = new Map();
for (const f of data.findings) {
  for (const x of f.findings) {
    if (ONLY && x.cls !== ONLY) continue;
    if (!byClass.has(x.cls)) byClass.set(x.cls, { n: 0, details: new Map(), fields: new Map(), langs: new Map() });
    const c = byClass.get(x.cls);
    c.n++;
    /* normalise the variable part out of a detail so members group */
    const key = String(x.detail).replace(/\d+/g, "N").slice(0, 110);
    c.details.set(key, (c.details.get(key) || 0) + 1);
    const fld = x.field.startsWith("option:") ? "option" : x.field;
    c.fields.set(fld, (c.fields.get(fld) || 0) + 1);
    c.langs.set(f.lang, (c.langs.get(f.lang) || 0) + 1);
  }
}

for (const [cls, c] of [...byClass].sort((a, b) => b[1].n - a[1].n)) {
  console.log("=== " + cls + "  (" + c.n + " flags, " + c.details.size + " distinct shapes)");
  console.log("    fields: " + [...c.fields].map(([k, v]) => k + "=" + v).join("  ") +
    "    langs: " + [...c.langs].map(([k, v]) => k + "=" + v).join("  "));
  for (const [d, n] of [...c.details].sort((a, b) => b[1] - a[1]).slice(0, TOP)) {
    console.log("    " + String(n).padStart(6) + "  " + d);
  }
  const shown = [...c.details].sort((a, b) => b[1] - a[1]).slice(0, TOP).reduce((s, x) => s + x[1], 0);
  if (c.n - shown > 0) console.log("    " + String(c.n - shown).padStart(6) + "  (in " + (c.details.size - TOP) + " further shapes)");
  console.log("");
}
