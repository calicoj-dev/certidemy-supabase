#!/usr/bin/env node
/**
 * no-heredoc.mjs -- PreToolUse hook on Bash. Refuses any command containing `<<`.
 *
 * ============ WHY A HOOK AND NOT A RULE ============
 *
 * A bash heredoc halves backslashes on the way to the shell. That has produced
 * TEN recorded defects (INCIDENTS.md), four of which still PARSED -- a regex
 * carrying literal BACKSPACE bytes is valid JavaScript that matches nothing, so
 * every signal you would normally rely on says the code is fine.
 *
 * The rule has been in CLAUDE.md for weeks. It was then narrowed to a token --
 * "if you are about to type `<<`, use the file tool" -- precisely so no judgement
 * was required. It was broken twice more in the session after that ruling, by the
 * author who had just written it down.
 *
 * So: a rule that has failed ten times is not a rule, it is a wish. This is the
 * mechanism. It cannot be forgotten, and it does not ask anyone to decide whether
 * THIS heredoc is the safe one.
 *
 * ============ WHY THE TOKEN AND NOT THE CONTENT ============
 *
 * Matching `<<` catches `<<EOF`, `<<-EOF` and `<<'EOF'` alike, and it also
 * catches `<<<` here-strings and the odd shift operator. That over-matching is
 * deliberate and cheap: every legitimate use has a better form, and a guard that
 * tries to decide which heredocs are safe reintroduces the judgement that failed.
 *
 * Exit 2 blocks the call and shows stderr to the model.
 */

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => { raw += d; });
process.stdin.on("end", () => {
  let cmd = "";
  try {
    const payload = JSON.parse(raw || "{}");
    cmd = String((payload.tool_input && payload.tool_input.command) || "");
  } catch {
    /* A hook that cannot parse its input must not silently allow. It also must
     * not block every command on a format change, so it says so and allows --
     * and saying so is what makes the third state visible. */
    process.stderr.write("no-heredoc hook: could not parse hook input; command ALLOWED unchecked.\n");
    process.exit(0);
  }

  if (!cmd.includes("<<")) process.exit(0);

  process.stderr.write(
    [
      "BLOCKED: this command contains `<<`.",
      "",
      "A bash heredoc halves backslashes in transit. Ten recorded defects",
      "(INCIDENTS.md), four of which still parsed -- a regex carrying literal",
      "backspace bytes is valid JavaScript that matches nothing.",
      "",
      "Use instead:",
      "  * file content  ->  the Write tool (or Edit for a change in place)",
      "  * commit message ->  Write it to a file, then `git commit -F <file>`",
      "  * stdin to a command -> write the input to a file and redirect with `<`",
      "",
      "The trigger is the token, not a judgement about this particular command.",
      "You do not get to decide that this heredoc is the safe one.",
    ].join("\n") + "\n",
  );
  process.exit(2);
});
