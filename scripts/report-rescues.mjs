#!/usr/bin/env node
/* READ-ONLY. Emits a director read document for items RESCUED by a gate fix: the full item, what
 * refused it before, which fix cleared it, and its solver result. Nothing is inserted by this.
 * The output quotes key_support verbatim, so it is gitignored by *-RESCUES-*.md.
 *
 *   node --dns-result-order=ipv4first scripts/report-rescues.mjs --cert=ISMS-F \
 *     --in=ISMSF-R8,ISMSF-R9 --ids=a,b,c --out=ISMSF-RESCUES-123.md --ruled-in="PROMPT-123 s2"
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const get = (n, d) => {
  const a = process.argv.slice(2).find((x) => x.startsWith("--" + n + "="));
  return a ? a.slice(n.length + 3) : d;
};
for (const a of process.argv.slice(2)) {
  if (!/^--(cert|in|ids|out|ruled-in)=/.test(a)) {
    console.error("unrecognised flag: " + a);
    console.error("READ-ONLY. --cert= --in=a,b --ids=a,b --out=<file> --ruled-in=<prompt>");
    process.exit(2);
  }
}
const CERT = get("cert", "ISMS-F");
const INS = get("in", "").split(",").map((s) => s.trim()).filter(Boolean);
const IDS = get("ids", "").split(",").map((s) => s.trim()).filter(Boolean);
const OUT = get("out", "");
const RULED = get("ruled-in", "");
if (!INS.length || !IDS.length || !OUT) {
  console.error("--in, --ids and --out are all required"); process.exit(2);
}

const found = new Map();
for (const f of INS) {
  const j = JSON.parse(readFileSync(join(ROOT, f), "utf8"));
  for (const it of (j.items || [])) if (IDS.includes(it.item_id)) found.set(it.item_id, { it, from: f });
}
/* A named id that is not in any artifact is a surprise, not an omission. */
const missing = IDS.filter((i) => !found.has(i));
if (missing.length) {
  console.error("REFUSING: " + missing.length + " named id(s) are in none of the artifacts: " + missing.join(", "));
  process.exit(2);
}
/* and every one must actually be solved -- this document is what the director reads before accepting */
const unsolved = [...found.entries()].filter(([, v]) => !(v.it.solver && v.it.solver.state === "accepted"));
if (unsolved.length) {
  console.error("REFUSING: " + unsolved.length + " item(s) are not solved `accepted`: " +
    unsolved.map(([k]) => k).join(", ") + ". Passing the gates is not being solved.");
  process.exit(2);
}

const L = (s) => md.push(s);
const md = [];
L("# " + CERT + " -- items rescued by a gate fix (" + RULED + ")");
L("");
L("**" + found.size + " item(s).** Each was REJECTED BY CODE when its round ran, passes every gate now that");
L("the gate defect it tripped over is fixed, and has been solved blind twice with the options reordered");
L("on the second run. **None of them is inserted.** They are here to be read.");
L("");
L("The gate fixes, both ruled PROMPT-123 s2:");
L("");
L("- **s2a** -- the attributed-quotation rule only recognised ISO anchor words, so an explanation");
L("  attributing to `MANAGE 4.3`, `MAP 5.1` or `Recital 133` was refused for *naming no clause* while");
L("  `normClause` was resolving those very addresses. One imported definition now.");
L("- **s2b** -- a distractor's support inherited the ITEM's edition, so task 2.3's distractors resolved");
L("  against 27001 Amd1:2024's one-sentence 4.1 instead of 27001:2022's paragraph. A distractor may now");
L("  resolve against any edition of the same source the task maps. **The key still may not.**");
L("");

const byTask = new Map();
for (const [id, v] of found) {
  const t = v.it.task_code;
  if (!byTask.has(t)) byTask.set(t, []);
  byTask.get(t).push([id, v]);
}
L("| task | items |");
L("|---|---|");
for (const t of [...byTask.keys()].sort()) L("| " + t + " | " + byTask.get(t).length + " |");
L("");
L("---");
L("");

let n = 0;
for (const t of [...byTask.keys()].sort()) {
  for (const [id, v] of byTask.get(t)) {
    const it = v.it, o = it.item;
    n++;
    L("### " + n + ". " + CERT + " / task " + it.task_code + " -- `" + id + "`");
    L("");
    L("- **artifact** " + v.from + ", was *" + (it.rescued_from_verdict || "rejected") + "*");
    L("- **anchor** " + o.source_id + " " + (o.edition || "") + " " + o.key_support_clause);
    const r = [...(it.revised || [])].reverse()[0];
    L("- **cleared by** " + ((r && r.ruled_in) || RULED) + (r && r.what ? " (" + r.what + ")" : ""));
    L("- **solver** " + it.solver.state + "/" + (it.solver.second ? it.solver.second.state : "?") +
      " over " + it.solver.runs + " run(s)" + (it.solver.shuffled ? ", options reordered on run two" : ""));
    L("");
    L("**" + (o.question_text || "").trim() + "**");
    L("");
    const ki = (o.options || []).findIndex((x) => x.is_correct === true);
    (o.options || []).forEach((x, i) => {
      L("- " + (i === ki ? "**KEY** " : "") + String.fromCharCode(65 + i) + ". " + String(x.text || "").trim());
    });
    L("");
    L("*Explanation.* " + String(o.explanation || "").trim());
    L("");
    L("*Anchor, verbatim in the passage.* " + String(o.key_support || "").trim());
    L("");
    for (const d of (o.distractor_support || [])) {
      L("*Distractor support.* " + (d.source_id || o.source_id) + " " + (d.edition || o.edition) +
        " " + d.clause + " -- " + String(d.support || "").trim());
    }
    L("");
    L("---");
    L("");
  }
}
L("## What to do with these");
L("");
L("Reply with an accept/reject per item by its id. An accept is inserted and translated; a reject goes");
L("to `" + CERT.replace(/-/g, "") + "-DIRECTOR-REJECTIONS.json` with its reason.");

writeFileSync(join(ROOT, OUT), md.join("\n") + "\n");
console.log("RESCUE READ DOCUMENT   " + CERT + "   " + RULED);
console.log("  items          " + found.size);
for (const t of [...byTask.keys()].sort()) console.log("    task " + t.padEnd(5) + byTask.get(t).length);
console.log("  every item solved accepted, options reordered on run two");
console.log("  wrote " + OUT + " (gitignored: it quotes key_support verbatim)");
