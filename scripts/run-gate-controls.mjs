#!/usr/bin/env node
/* Read-only. Runs the gate and cue control suites and prints failures. */
import { groundedGateControls } from "./lib/grounded-gates.mjs";
import { storedItemControls } from "./lib/stored-item.mjs";
import { quoteNoiseControls } from "./lib/quote-noise.mjs";

let bad = 0;
for (const [label, c] of [["grounded-gates", groundedGateControls()], ["stored-item", storedItemControls()],
  ["quote-noise", quoteNoiseControls({ quiet: true })]]) {
  const fails = c.fails || [];
  console.log(label.padEnd(16) + String(c.examined).padStart(4) + " case(s)   " +
    (fails.length ? fails.length + " FAIL" : "all pass"));
  for (const f of fails) { console.log("    FAIL " + f); bad++; }
}
process.exitCode = bad ? 2 : 0;
