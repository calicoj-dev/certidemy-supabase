/**
 * dump-0501-spans.mjs -- the exact current es-419 and pt-BR text of the two spans,
 * so the retranslation drafts replace real anchors rather than remembered ones.
 * READ-ONLY.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
for (const a of process.argv.slice(2)) { console.error("no flags"); process.exitCode = 2; process.exit(); }

const rows = await getAll(requireKey(HERE),
  "lessons?select=language,content_md&slug=eq.05-01-aims-monitoring-and-measurement&order=language");

/* Cut from the callout marker to the closing `::`, and from the sentence opener to
 * the end of its paragraph -- located by a stable landmark in each language. */
const LANDMARKS = {
  "es-419": ["criterios de desempeño", "un error específico"],
  "pt-BR": ["critérios de desempenho", "um erro específico"],
};

for (const r of rows) {
  if (r.language === "en") continue;
  const md = String(r.content_md);
  console.log("=================== " + r.language);
  for (const probe of [LANDMARKS[r.language][1], "uso", "propósito", "propositos", "finalidades"]) {
    const i = md.indexOf(probe);
    if (i < 0) continue;
    /* paragraph boundaries: previous and next blank line */
    const start = Math.max(0, md.lastIndexOf("\n\n", i) + 2);
    const endRel = md.indexOf("\n\n", i);
    const end = endRel < 0 ? md.length : endRel;
    console.log("--- around " + JSON.stringify(probe) + " ---");
    console.log(JSON.stringify(md.slice(start, end)));
    console.log("");
  }
}
