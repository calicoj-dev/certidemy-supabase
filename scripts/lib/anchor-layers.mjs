/**
 * anchor-layers.mjs -- which ANCHOR-OR-FLAG artifacts to read, and in what order.
 *
 * DERIVED FROM THE DIRECTORY, never hand-kept. The list was maintained by hand in three scripts and I
 * edited it twice; the first time, `shortfall-13` kept its own copy and went on reading a stale anchor
 * after a re-anchor had moved it. A hand-kept list of which files exist is a second copy of a fact the
 * filesystem already holds.
 *
 * ORDER IS PRECEDENCE: later layers win. Sorting by name would put `-director-87` ahead of `-modal`,
 * so the pipeline stages are named explicitly and anything else follows by mtime, oldest first -- a
 * later re-anchor should override an earlier one.
 */
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

/* the pipeline stages, in the order they run. Anything matching the prefix but not named here is a
 * TAGGED layer and sorts after them. */
const STAGES = ["", "-rerun", "-modal"];

export function anchorLayers(root, cert = "AIMS-F") {
  const prefix = "ANCHOR-OR-FLAG-" + cert + "-all-secure";
  const all = readdirSync(root).filter((f) => f.startsWith(prefix) && f.endsWith(".json"));
  const staged = STAGES.map((s) => prefix + s + ".json").filter((f) => all.includes(f));
  const tagged = all.filter((f) => !staged.includes(f))
    .map((f) => ({ f, m: statSync(join(root, f)).mtimeMs }))
    .sort((a, b) => a.m - b.m)
    .map((x) => x.f);
  return [...staged, ...tagged].filter((f) => existsSync(join(root, f)));
}

/* prefix -> anchor clause, and prefix -> task, merged in precedence order */
export function anchorIndex(root, cert = "AIMS-F", readJson) {
  const anchorOf = new Map(), taskOf = new Map(), layers = anchorLayers(root, cert);
  for (const f of layers) {
    for (const it of (readJson(join(root, f)).items || [])) {
      if (it.anchor && it.anchor.clause) anchorOf.set(it.prefix, it.anchor.clause);
      if (it.task) taskOf.set(it.prefix, it.task);
    }
  }
  return { anchorOf, taskOf, layers };
}
