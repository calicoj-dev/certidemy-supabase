#!/usr/bin/env node
/**
 * test-no-heredoc.mjs -- positive and negative control for the heredoc hook.
 *
 * A guard nobody has watched fire is the same object as a count assertion nobody
 * has watched fail. This runs the real hook as a child process, feeds it the real
 * payload shape, and asserts BOTH directions: a heredoc must be refused with exit
 * 2, and an ordinary command must pass with exit 0.
 *
 * The forbidden token is BUILT from character codes rather than typed, so this
 * test file does not itself trip the hook that guards the repository.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, "no-heredoc.mjs");
const LT = String.fromCharCode(60);          // "<"
const HEREDOC = LT + LT;                     // the token, never typed literally

function run(command) {
  const payload = JSON.stringify({ tool_name: "Bash", tool_input: { command } });
  const r = spawnSync(process.execPath, [HOOK], { input: payload, encoding: "utf8" });
  return { code: r.status, err: String(r.stderr || "") };
}

const cases = [
  [HEREDOC + "EOF", 2, "a bare heredoc"],
  ["cat " + HEREDOC + "'EOF'\\nhi\\nEOF", 2, "a quoted heredoc"],
  ["cat " + HEREDOC + "-EOF", 2, "a dash heredoc"],
  ["git commit -F - " + HEREDOC + "MSG", 2, "a commit-message heredoc"],
  [LT + LT + LT + " herestring", 2, "a here-string"],
  ["git status --short", 0, "an ordinary command"],
  ["node --check scripts/x.mjs", 0, "a node check"],
  ["git commit -q -F /tmp/msg.txt", 0, "the approved commit form"],
  ["grep -n 'a " + LT + " b' file.txt", 0, "a single less-than is not a heredoc"],
  ["node hook.mjs " + LT + " fixture.json", 0, "input redirection is allowed"],
];

const bad = [];
for (const [cmd, want, why] of cases) {
  const { code, err } = run(cmd);
  if (code !== want) bad.push(why + ": expected exit " + want + ", got " + code);
  if (want === 2 && !/BLOCKED/.test(err)) bad.push(why + ": blocked without naming the reason");
  if (want === 2 && !/git commit -F/.test(err)) bad.push(why + ": refusal does not name the remedy");
}

/* An unparseable payload must ALLOW and SAY SO -- a hook that blocks everything on
 * a format change is a hook the next person disables, taking the real guard with it. */
const odd = spawnSync(process.execPath, [HOOK], { input: "not json", encoding: "utf8" });
if (odd.status !== 0) bad.push("an unparseable payload blocked the command instead of allowing it");
if (!/ALLOWED unchecked/.test(String(odd.stderr || ""))) bad.push("an unparseable payload allowed SILENTLY");

if (bad.length) {
  console.error("HEREDOC HOOK CONTROL FAILED");
  for (const b of bad) console.error("  " + b);
  process.exitCode = 2;
} else {
  console.log("heredoc hook: " + cases.length + " cases, both directions asserted, all pass");
  console.log("  refused: " + cases.filter((c) => c[1] === 2).length +
    "   allowed: " + cases.filter((c) => c[1] === 0).length +
    "   unparseable payload allows and says so");
}
