/**
 * js-source.mjs -- strip comments from JavaScript source, keeping string
 * literals intact, line by line.
 *
 * ============ WHY THIS IS SHARED AND NOT COPIED ============
 *
 * Two source checks need it -- `check-control-bytes` (invariant 10) and
 * `check-word-boundary-regexes` (invariant 13) -- and both are looking for a
 * mangled escape in CODE. A comment that *documents* the defect is not the
 * defect, and every guard in this family has fired on its own documentation at
 * least once: invariant 10's first run fired three times and all three were
 * comments, two of them the note describing the instance it was built for.
 *
 * A computation with a stated invariant has exactly one implementation. A second
 * hand-written copy of a comment stripper would agree today and diverge the first
 * time either check met a template literal or a regex containing a slash-star.
 *
 * `codeOnLines(src)` returns one entry per source line holding only the code
 * portion: block and line comments removed, string literals preserved verbatim
 * including their escapes, and the line count preserved so a reported index
 * still maps to the real line number.
 */

export const splitLines = (t) =>
  String(t).split(new RegExp(String.fromCharCode(13) + "?" + String.fromCharCode(10)));

export function codeOnLines(src) {
  const out = [];
  let inBlock = false;
  for (const ln of splitLines(src)) {
    let code = "", i = 0, quote = null;
    while (i < ln.length) {
      const c = ln[i], d = ln[i + 1];
      if (inBlock) {
        if (c === "*" && d === "/") { inBlock = false; i += 2; continue; }
        i++; continue;
      }
      if (!quote && c === "/" && d === "*") { inBlock = true; i += 2; continue; }
      if (!quote && c === "/" && d === "/") break;
      if (quote) {
        code += c;
        if (c === "\\") { code += d || ""; i += 2; continue; }
        if (c === quote) quote = null;
        i++; continue;
      }
      if (c === '"' || c === "'") { quote = c; code += c; i++; continue; }
      code += c; i++;
    }
    out.push(code);
  }
  return out;
}

/** Fixtures. Both callers run these, so a change here fails at both call sites. */
export function jsSourceControls() {
  const bad = [];
  const BS = String.fromCharCode(92);
  const cases = [
    ['const a = 1; // \\p{L} in a line comment', 'const a = 1; ', "a line comment is removed"],
    ['/* \\p{L} in a block comment */const b = 2;', 'const b = 2;', "a block comment is removed"],
    ['const c = "' + BS + BS + 'p{L}"; // note', 'const c = "' + BS + BS + 'p{L}"; ', "a string literal survives with its escapes"],
    ["const d = 'a // b';", "const d = 'a // b';", "a slash-slash inside a string is not a comment"],
    ['const e = "a /* b */ c";', 'const e = "a /* b */ c";', "a block marker inside a string is not a comment"],
    ['const f = "' + BS + '"quoted' + BS + '"";', 'const f = "' + BS + '"quoted' + BS + '"";', "an escaped quote does not end the string"],
  ];
  for (const [src, want, why] of cases) {
    const got = codeOnLines(src).join("");
    if (got !== want) bad.push(why + " -- got " + JSON.stringify(got) + ", wanted " + JSON.stringify(want));
  }
  /* The line count must be preserved or every reported line number is wrong. */
  const multi = "a\n/* x\n y */\nb";
  if (codeOnLines(multi).length !== 4) bad.push("line count not preserved across a block comment");
  return bad;
}
