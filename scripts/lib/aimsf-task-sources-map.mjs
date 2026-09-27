/**
 * aimsf-task-sources-map.mjs -- the director's ruling on which passages each AIMS-F task is
 * examined against. DECLARED, not inferred.
 *
 * The earlier draft was a RANKER: title-phrase and term overlap, offered as candidates for a
 * human to promote. This module is the human's answer, so nothing here is scored or guessed --
 * an id either resolves against the library or the write is refused by name.
 *
 * ============ RANGES AND WILDCARDS ARE EXPANDED FROM THE LIBRARY, NOT TYPED OUT ============
 *
 * The ruling uses "A.6.2.2-A.6.2.8" and "B.2.x". Typing out the members would be a second copy
 * of a fact the library already holds, and it would go stale the next time the extractor
 * recovers a control -- which happened twice this week (A.4.6, A.9.4). The expander asks the
 * library, so a range covers what exists.
 *
 * A RANGE THAT EXPANDS TO NOTHING IS AN ERROR, not an empty list. That is the whole failure
 * mode of a declared map: a typo in a range silently maps a task to no passages, the generator
 * then has nothing to anchor in, and every item for that task is refused for a reason that
 * names the item rather than the map.
 *
 * ============ CROSS-SOURCE ENTRIES ============
 *
 * Tasks 1.4, 3.7, 4.7 and 5.6 examine the relationship BETWEEN standards, so they carry
 * supporting passages from ISO/IEC 27001, 27002 and ISO 19011. A prefix names the source; bare
 * ids are ISO/IEC 42001:2023. The generator's rule, per the ruling: a key may anchor in another
 * standard ONLY when the item names that standard.
 *
 * ============ AND 5.5 IS A HOLD ============
 *
 * Task 5.5 (the certification route, ISO/IEC 42006) has NO grounded items until 42006 and
 * 17021-1 are acquired. It is present here with an empty map and a reason, rather than absent,
 * because an absent task is indistinguishable from one nobody has got to yet.
 */

/** Bare ids are this standard. A prefix selects another. */
export const DEFAULT_SOURCE = { source_id: "ISO/IEC 42001", edition: "2023" };
export const SOURCE_PREFIX = {
  "27001": { source_id: "ISO/IEC 27001", edition: "2022" },
  "27002": { source_id: "ISO/IEC 27002", edition: "2022" },
  "19011": { source_id: "ISO 19011", edition: "2026" },
  /* Added when tasks 5.5 and 1.5 came off hold. 5.5 resolves BY TITLE against these two, per the
   * ruling -- the clause numbers in the ruling's parentheses are the check on what a title resolved
   * to, not the thing typed into the map. */
  "42006": { source_id: "ISO/IEC 42006", edition: "2025" },
  "17021": { source_id: "ISO/IEC 17021-1", edition: "2015" },
  /* The AI Act's ids are `Art. 6(1)`, not a decimal, and its prefix is not a standard number -- which
   * is why the plain-prefix pattern below accepts a short alphanumeric key as well as a 4-5 digit
   * one. 1.5's additions are TYPED article ids because the ruling approved those exact articles. */
  "euact": { source_id: "EU AI Act", edition: "2024/1689" },
};

/**
 * THE RULING. `primary` is what the task is ABOUT and is the only place a KEY may anchor;
 * `supporting` is context a distractor's reason may use.
 */
export const AIMSF_TASK_SOURCES = {
  "1.1": { primary: ["3.4", "4.4", "1"], supporting: ["3.1", "3.5", "3.6", "3.8", "D.1"] },
  "1.2": { primary: ["4.1"], supporting: ["4.3", "3.2", "A.10.2", "B.10.2"] },
  "1.3": {
    primary: ["A.6", "A.6.1", "A.6.2", "B.6.1.1", "B.6.2.1", "C.3.6"],
    supporting: ["A.6.1.2", "A.6.1.3", "A.6.2.2-A.6.2.8", "B.6.2.2-B.6.2.8", "A.7.5"],
  },
  "1.4": { primary: ["D.1", "D.2"], supporting: ["3.4", "4.4", "2", "27001:4.4"] },
  /* ============ 1.5's ADDITIONS APPROVED, AND THE NOTE IS LIFTED. Ruled 2026-09-27 ============
   *
   * "Explain the regulatory drivers for an AIMS and why certification is not compliance."
   *
   * The note forbade "certification is not compliance" items until the AI Act and 42006/17021-1 were
   * acquired. All three are held, so it is GONE rather than marked -- it was a live instruction, and a
   * marker beside an instruction competes with it instead of removing it.
   *
   * THE GATES DECIDE NOW, which is the ruling's own reasoning: an item with no passage saying so
   * cannot anchor, so the prohibition does not need to be restated as prose. */
  "1.5": {
    primary: ["4.1", "5.2"],
    supporting: ["D.2", "B.8.4",
      "euact:Art. 6(1)",   /* classification rules for high-risk AI systems */
      "euact:Art. 17(1)",  /* quality management system */
      "euact:Art. 41(1)",  /* common specifications */
      "euact:Art. 43(1)",  /* conformity assessment */
      "42006:1"],          /* what 42006 governs, which is the other half of the distinction */
  },
  "1.6": {
    primary: ["1", "3.4"], supporting: ["C.2", "B.6.2.4", "4.1"],
    note: "Grounding is thin. EVERY 1.6 item goes to the director.",
    escalate: true,
  },
  "2.1": { primary: ["4.1", "4.2"], supporting: ["3.2", "4.3"] },
  "2.2": { primary: ["4.3"], supporting: ["4.1", "4.2", "4.4"] },
  "2.3": {
    primary: ["5.1", "5.2", "6.2", "6.3"],
    supporting: ["A.2.2", "A.2.3", "A.2.4", "B.2.2", "B.2.3", "B.2.4", "3.3"],
  },
  "2.4": { primary: ["5.3", "A.3.2"], supporting: ["B.3.2", "A.3.3", "B.3.3", "3.3"] },
  "2.5": { primary: ["6.1.1", "6.1.2"], supporting: ["8.2", "6.1.4", "C.2", "C.3"] },
  "2.6": { primary: ["6.1.4", "8.4", "A.5.2-A.5.5"], supporting: ["B.5.2-B.5.5", "6.1.2"] },
  "2.7": { primary: ["6.1.2", "6.1.4"], supporting: ["8.2", "8.4", "A.5.2"] },
  "2.8": { primary: ["6.1.3", "3.26"], supporting: ["8.3", "A.1", "B.1", "6.1.1"] },
  "3.1": { primary: ["7.1", "7.2"], supporting: ["A.4.2-A.4.6", "B.4.2-B.4.6"] },
  "3.2": { primary: ["7.3", "7.4"], supporting: ["5.2", "A.3.3"] },
  "3.3": { primary: ["7.5.1", "7.5.2", "7.5.3"], supporting: ["3.10"] },
  "3.4": { primary: ["8.1"], supporting: ["6.1.3", "6.2", "6.3"] },
  "3.5": { primary: ["A.10.2-A.10.4", "B.10.2-B.10.4", "8.1"], supporting: ["4.1"] },
  "3.6": { primary: ["A.7.2-A.7.6", "B.7.2-B.7.6"], supporting: ["3.25", "C.3.4"] },
  "3.7": {
    primary: ["7.1-7.4", "7.5.1-7.5.3", "8.1", "D.2"],
    supporting: ["4.3", "6.1.4", "8.2", "8.4", "27001:7.1-7.5", "27001:8.1"],
  },
  "3.8": { primary: ["8.2", "8.3", "8.4"], supporting: ["6.1.2", "6.1.3", "6.1.4"] },
  "4.1": { primary: ["A.1", "B.1", "6.1.3"], supporting: ["A.2-A.10"] },
  "4.2": { primary: ["6.1.3", "3.26"], supporting: ["A.1", "B.1"] },
  "4.3": {
    primary: ["A.2.2-A.2.4", "A.3.2", "A.3.3", "A.4.2-A.4.6"],
    supporting: ["B.2.x", "B.3.x", "B.4.x"],
  },
  "4.4": {
    primary: ["A.5.2-A.5.5", "A.6.1.2", "A.6.1.3", "A.6.2.2-A.6.2.8"],
    supporting: ["B.5.x", "B.6.x"],
  },
  "4.5": { primary: ["A.7.2-A.7.6", "A.8.2-A.8.5"], supporting: ["B.7.x", "B.8.x"] },
  "4.6": { primary: ["A.9.2-A.9.4", "A.10.2-A.10.4"], supporting: ["B.9.x", "B.10.x", "C.2"] },
  "4.7": {
    primary: ["D.2"],
    supporting: ["B.6.1.2", "A.6.2.8", "A.7.x"],
    /* "27001 Annex A and 27002 5-8, only for the controls an item names" is CONDITIONAL on the
     * item, so it cannot be a static row set -- writing all of 27001's annex and 27002's
     * clauses 5 to 8 would map one task to over 300 passages and make "supporting" meaningless.
     * Recorded as an allowance the generator applies per item instead. */
    conditional_cross_source: ["27001:AnnexA", "27002:5-8"],
    note: "27001 Annex A and 27002 clauses 5-8 are allowed as supporting ONLY for the controls a given item names.",
  },
  "5.1": { primary: ["9.1"], supporting: ["A.6.2.6", "B.6.2.6", "6.2"] },
  "5.2": { primary: ["9.2.1", "9.2.2"], supporting: ["3.18"] },
  "5.3": { primary: ["9.3.1", "9.3.2", "9.3.3"], supporting: ["10.1"] },
  "5.4": {
    primary: ["10.2"],
    /* "the 42001 definitions of nonconformity and corrective action (resolve their numbers)" --
     * resolved from the library by TITLE rather than typed, so a renumbering cannot silently
     * point this at the wrong definition. */
    supporting: ["10.1", "@definition:nonconformity", "@definition:corrective"],
  },
  /* ============ 5.5 IS OFF HOLD. Ruled 2026-09-27 ============
   *
   * "Describe the certification route and what ISO/IEC 42006 governs." Both standards are now held
   * (42006 98 passages, 17021-1 249, 0 missing against their own declarations).
   *
   * THE ROUTE ITSELF LIVES IN 17021-1, so it is PRIMARY too, not supporting -- that is the ruling,
   * and it matters: primary is the only place a key may anchor, so an item about stage 1 and stage 2
   * could not otherwise be keyed to the clause that defines them.
   *
   * RESOLVED BY TITLE, NOT BY TYPED NUMBER. The numbers in the ruling's parentheses are the CHECK on
   * what each title resolved to; write-task-sources.mjs reports the resolution per entry. */
  "5.5": {
    primary: [
      "42006:1",                              /* Scope -- the one id the ruling names outright */
      "@42006:title:scope of certification",  /* 9.1.3 */
      "@42006:title:certification documents", /* 8.2.2 */
      "@42006:title:competence",              /* 7.1.2 and its specific siblings */
      "@17021:title:stage 1",
      "@17021:title:stage 2",
      "@17021:title:surveillance",
      "@17021:title:recertification",
      "@17021:title:audit programme",         /* where the three-year cycle lives */
    ],
    supporting: [
      /* AUDIT TIME IS THE ONE ENTRY THAT IS TYPED, and the title lookup is why. `title:audit time`
       * resolves to FOURTEEN clauses -- 9.1.4.2 plus the whole of Annex A and Annex B's audit-time
       * factor tables (A.1-A.8, B.2.x). The ruling names 9.1.4.2, and the parenthetical number is
       * the check on what a title resolved to: here the check fails the lookup 14 to 1. Supporting
       * context is what a distractor's reason may anchor in, and a factor table is not context for
       * "describe the certification route" -- it is a different subject that shares a phrase. */
      "42006:9.1.4.2",
      "@17021:title:management of impartiality", /* 5.2.1 and its twelve sibling paragraphs */
    ],
  },
  "5.6": {
    primary: ["9.2.2", "D.2"],
    /* "19011 passages on combined audits and audit programmes (resolve them)". The audit
     * programme is clause 5 and its subclauses, which their TITLES name; a combined audit is
     * discussed inside clauses titled "General" and "Audit scope", so only a TEXT lookup
     * reaches it. Two topics, two modes, both stated. */
    supporting: ["6.1.4", "8.2", "27001:9.2.2",
      "@19011:text:combined audit", "@19011:title:audit programme"],
  },
};

/** Tasks whose keys may anchor in another standard when the item names it. */
export const CROSS_SOURCE_TASKS = new Set(["1.4", "3.7", "4.7", "5.6"]);

/**
 * Expand one declared entry against the library.
 * Returns { source_id, edition, clauses[] } or { error }.
 */
const needleOf = (x) => String(x).toLowerCase().trim();

export function expandEntry(entry, passages) {
  const raw = String(entry);

  /* ============ A LOOKUP BY NAME STATES ITS MODE ============
   *
   *   @definition:nonconformity      a DEFINED TERM: clause 3.x whose title is the term
   *   @19011:title:audit programme   passages whose TITLE carries the phrase
   *   @19011:text:combined audit     passages whose TEXT carries it, for a topic no title names
   *
   * The first version searched title-or-text for everything and was wrong in both directions.
   * "corrective action" matched six passages -- clauses 8.1, 9.3.2 and B.10.3 merely MENTION it
   * -- when the ruling asks for the DEFINITION; "audit programme" matched forty. A lookup whose
   * breadth is a side effect of which fields it happens to search is not a resolution, and the
   * ruling said resolve them, not approximate them. */
  if (raw.startsWith("@")) {
    const m = /^@(?:(\d{4,5}):)?(definition|title|text):(.+)$/.exec(raw);
    if (!m) return { error: raw + ": a name lookup must state its mode -- definition, title or text" };
    const src = m[1] ? SOURCE_PREFIX[m[1]] : DEFAULT_SOURCE;
    if (!src) return { error: raw + ": unknown source prefix" };
    const mode = m[2];
    /* THE PHRASE IS SEARCHED IN THE WHOLE PASSAGE, NOT ONLY ITS TITLE. The ruling asks for
     * "19011 passages on combined audits and audit programmes (resolve them)" -- and ISO 19011
     * discusses a combined audit inside clauses titled "General" and "Audit scope", so a
     * title-and-opening search found nothing and reported the entry unresolvable. Seventeen of
     * its passages carry the phrase.
     *
     * A CONTAINER IS EXCLUDED, because a match in a parent whose children are also held would
     * map the task to the whole block as well as its parts. */
    const needle = needleOf(m[3]);
    const inSrc = passages.filter((p) => p.source_id === src.source_id && p.edition === src.edition);
    const heldHere = new Set(inSrc.map((p) => p.clause));
    const isContainer = (c) => [...heldHere].some((h) => h !== c && h.startsWith(c + "."));
    const hits = inSrc.filter((p) => {
      if (isContainer(p.clause)) return false;
      const title = String(p.title || "").toLowerCase();
      if (mode === "definition") return /^3(\.\d+)+$/.test(p.clause) && title.includes(needle);
      if (mode === "title") return title.includes(needle);
      return String(p.text || "").toLowerCase().includes(needle);
    });
    if (!hits.length) return { error: raw + ": resolved to no passage by " + mode };
    return { ...src, clauses: hits.map((p) => p.clause), resolved_by: mode + ":" + m[3] };
  }

  /* an optional source prefix */
  let src = DEFAULT_SOURCE, body = raw;
  /* A SHORT ALPHANUMERIC KEY, not only a standard number: the EU AI Act's prefix is `euact` and its
   * clause ids look like `Art. 6(1)`. A plain clause carries no colon, so widening this cannot
   * capture one by accident. */
  const pre = /^([A-Za-z0-9-]{3,10}):(.+)$/.exec(raw);
  if (pre) {
    src = SOURCE_PREFIX[pre[1]];
    if (!src) return { error: raw + ": unknown source prefix" };
    body = pre[2];
  }
  const inSource = passages.filter((p) => p.source_id === src.source_id && p.edition === src.edition);
  const held = new Set(inSource.map((p) => p.clause));

  /* B.2.x -- every held clause under that prefix */
  const wild = /^(.+)\.x$/.exec(body);
  if (wild) {
    const clauses = [...held].filter((c) => c.startsWith(wild[1] + "."));
    return clauses.length ? { ...src, clauses } : { error: raw + ": wildcard matched no held clause" };
  }

  /* A.5.2-A.5.5 or 7.1-7.4 -- inclusive, over what the library holds at that depth */
  const range = /^(.+?)-(.+)$/.exec(body);
  if (range && !/^[A-Z]$/.test(range[2])) {
    const a = range[1], b = range[2].includes(".") ? range[2] : null;
    const keyOf = (c) => c.split(".").map((x) => (/^\d+$/.test(x) ? Number(x) : x));
    const cmp = (x, y) => {
      const kx = keyOf(x), ky = keyOf(y);
      for (let i = 0; i < Math.max(kx.length, ky.length); i++) {
        const u = kx[i], v = ky[i];
        if (u === undefined) return -1;
        if (v === undefined) return 1;
        if (u !== v) return typeof u === "number" && typeof v === "number" ? u - v : String(u).localeCompare(String(v));
      }
      return 0;
    };
    const hi = b || (a.replace(/\.\d+$/, "") + "." + range[2]);
    /* Same DEPTH as the endpoints, so "7.1-7.4" does not swallow 7.5.1. */
    const depth = a.split(".").length;
    const clauses = [...held].filter((c) =>
      c.split(".").length === depth && cmp(c, a) >= 0 && cmp(c, hi) <= 0);
    return clauses.length ? { ...src, clauses } : { error: raw + ": range matched no held clause" };
  }

  /* A.2-A.10 written as a group range of one-level annex ids */
  const grp = /^([A-Z])\.(\d+)-([A-Z])\.(\d+)$/.exec(body);
  if (grp && grp[1] === grp[3]) {
    const clauses = [];
    for (let i = Number(grp[2]); i <= Number(grp[4]); i++) {
      const c = grp[1] + "." + i;
      if (held.has(c)) clauses.push(c);
    }
    return clauses.length ? { ...src, clauses } : { error: raw + ": group range matched no held clause" };
  }

  if (held.has(body)) return { ...src, clauses: [body] };

  /* A CONTAINER IS ITS OWN STATE, NEITHER A LINK NOR AN ERROR.
   *
   * ISO/IEC 42001 clause A.6 is the group heading "AI system life cycle", and the library holds
   * its children A.6.1 and A.6.2 rather than the heading -- so there is no row to link to. The
   * ruling lists all three. Reporting it as "not in the library" would read as a defect in the
   * extractor or in the standard; reporting it as a container says the truth, which is that its
   * parts carry the text and are themselves mapped. */
  const kids = [...held].filter((c) => c.startsWith(body + "."));
  if (kids.length) return { ...src, container: body, clauses: [], children: kids };

  return { error: raw + ": not in the library" };
}

/** Controls: the expander's own behaviour, on cases whose answer is fixed. */
export function mapControls(passages) {
  const fails = [];
  const cases = [
    ["a bare id resolves", "9.2.2", (r) => r.clauses && r.clauses.length === 1 && r.clauses[0] === "9.2.2"],
    ["a range keeps its depth", "7.1-7.4", (r) => r.clauses && r.clauses.every((c) => c.split(".").length === 2)],
    ["a range excludes a deeper child", "7.1-7.4", (r) => r.clauses && !r.clauses.includes("7.5.1")],
    ["a wildcard expands", "B.2.x", (r) => r.clauses && r.clauses.length >= 2 && r.clauses.every((c) => c.startsWith("B.2."))],
    ["a cross-source prefix selects that source", "27001:9.2.2", (r) => r.source_id === "ISO/IEC 27001"],
    ["a definition lookup resolves to a 3.x clause", "@definition:nonconformity", (r) => r.clauses && r.clauses.length >= 1 && r.clauses.every((c) => /^3./.test(c))],
    ["a title lookup stays in titles", "@19011:title:audit programme", (r) => r.clauses && r.clauses.length >= 3],
    ["a lookup with no mode is an ERROR", "@nonconformity", (r) => !!r.error],
    ["an unknown id is an ERROR, never empty", "9.9.9", (r) => !!r.error],
    ["a wildcard matching nothing is an ERROR", "Z.9.x", (r) => !!r.error],
  ];
  for (const [name, entry, ok] of cases) {
    let r;
    try { r = expandEntry(entry, passages); } catch (e) { r = { error: "threw: " + e.message }; }
    if (!ok(r)) fails.push(name + " -- " + entry + " gave " + JSON.stringify(r).slice(0, 120));
  }
  return { examined: cases.length, fails };
}
