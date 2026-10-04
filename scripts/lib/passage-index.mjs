/**
 * passage-index.mjs -- the library indexed on (source_id, edition, clause), with a per-item SCOPED VIEW.
 *
 * WHY A VIEW AND NOT A RE-KEYED MAP. Every gate looks up a BARE clause, and one iterates the key set to
 * find a container's children. Handing them a 3-part-keyed Map would require each gate to know the item's
 * source and edition, and a gate that forgets is a silent wrong answer -- the 3.4 collision again.
 * So the index is keyed correctly and `.for(source, edition)` hands a gate the same {get,has,keys}
 * interface it already uses, scoped so a lookup CANNOT cross a standard or an edition.
 *
 * This is what replaces the generator's single-standard pre-filter. The filter made the collision
 * reachable (it dropped 17021-1 and left 42001's 3.4 to answer for it); per-item scoping is strictly
 * stronger, because it is the ITEM's own source that bounds the lookup rather than the run's.
 */
import { passageKey, keyOfPassage, parseKey } from "./passage-key.mjs";

export function makePassageIndex(passages) {
  if (!Array.isArray(passages)) throw new TypeError("makePassageIndex: passages must be an array");
  const byKey = new Map();
  const clausesBy = new Map();        /* "src|ed" -> Map clause -> passage */
  for (const p of passages) {
    const k = keyOfPassage(p);
    byKey.set(k, p);
    const se = String(p.source_id) + "|" + String(p.edition);
    if (!clausesBy.has(se)) clausesBy.set(se, new Map());
    clausesBy.get(se).set(String(p.clause), p);
  }
  if (!byKey.size) throw new Error("makePassageIndex: the library is empty; every gate would be UNASSERTED");

  /* ============ CASE IS NOT PART OF AN ADDRESS (PROMPT-122 s2) ============
   *
   * Since normClause stopped stripping non-ISO scheme words, a clause key can be a WORD: `MANAGE 4.3`,
   * `Recital 111`, `Art. 55(1)`. The writer is told to cite them exactly and does, but an exact-case
   * Map lookup makes `manage 4.3` a different passage from `MANAGE 4.3` -- and a case difference is not
   * a different clause of a standard.
   *
   * So the lookup falls back to a case-folded key. EXACT MATCH IS TRIED FIRST, so nothing about ISO
   * addresses changes; the fold only ever rescues a miss. A fold that collided with a DIFFERENT held
   * clause would be a real hazard, so the folded map is built only where the fold is unambiguous and
   * the collisions are counted. */
  const foldedBy = new Map();
  for (const [se, m] of clausesBy) {
    const folded = new Map(), clash = new Set();
    for (const k of m.keys()) {
      const fk = String(k).toLowerCase().replace(/\s+/g, " ").trim();
      if (folded.has(fk) && folded.get(fk) !== k) clash.add(fk);
      folded.set(fk, k);
    }
    for (const fk of clash) folded.delete(fk);   /* ambiguous: no fallback rather than a guess */
    foldedBy.set(se, folded);
  }
  const view = (sourceId, edition) => {
    const se = String(sourceId) + "|" + String(edition);
    const m = clausesBy.get(se) || new Map();
    const folded = foldedBy.get(se) || new Map();
    const resolve = (clause) => {
      const k = String(clause);
      if (m.has(k)) return k;
      const fk = k.toLowerCase().replace(/\s+/g, " ").trim();
      return folded.has(fk) ? folded.get(fk) : null;
    };
    return {
      source_id: sourceId, edition, size: m.size, scoped: true,
      get: (clause) => { const k = resolve(clause); return k === null ? undefined : m.get(k); },
      has: (clause) => resolve(clause) !== null,
      keys: () => m.keys(),
      /* the full key, for a report or a cap census */
      keyOf: (clause) => passageKey(sourceId, edition, clause),
    };
  };

  return {
    size: byKey.size,
    byKey,
    pairs: () => [...clausesBy.keys()].map((se) => { const p = parseKey(se + "|x"); return { source_id: p.source_id, edition: p.edition, count: clausesBy.get(se).size }; }),
    /* the UNSCOPED getters route through the scoped view so they inherit the case-folded fallback:
     * two lookups of the same address disagreeing by case is the kind of split this file exists to stop. */
    get: (sourceId, edition, clause) => byKey.get(passageKey(sourceId, edition, clause)) ||
      view(sourceId, edition).get(clause),
    has: (sourceId, edition, clause) => byKey.has(passageKey(sourceId, edition, clause)) ||
      view(sourceId, edition).has(clause),
    for: view,
    /* A scoped view for an ITEM, from its own grounding. An item with no source is an error, not a
     * default -- defaulting is how the collision was reachable. */
    forItem: (item) => {
      const s = item && (item.source_id ?? item.standard);
      const e = item && item.edition;
      if (!s || !e) throw new Error("passageIndex.forItem: item has no (source_id, edition); a scoped lookup is impossible");
      return view(s, e);
    },
  };
}

/** Both directions, including the collision that bought the re-key. */
export function passageIndexControls() {
  const fails = [];
  const L = [
    { source_id: "ISO/IEC 42001", edition: "2023", clause: "3.4", title: "management system", text: "A management system is a set of interrelated elements." },
    { source_id: "ISO/IEC 17021-1", edition: "2015", clause: "3.4", title: "certification audit", text: "A certification audit is carried out by a certification body." },
    { source_id: "ISO/IEC 42001", edition: "2023", clause: "A.9", title: "Use of AI systems", text: "container" },
    { source_id: "ISO/IEC 42001", edition: "2023", clause: "A.9.3", title: "Objectives", text: "child" },
    { source_id: "ISO/IEC 27000", edition: "2018", clause: "3.1", title: "old", text: "old edition" },
    { source_id: "ISO/IEC 27000", edition: "2022", clause: "3.1", title: "new", text: "new edition" },
  ];
  const ix = makePassageIndex(L);
  const t = (what, cond) => { if (!cond) fails.push(what); };

  /* THE COLLISION: one clause number, two standards, two different passages. */
  t("42001 3.4 resolves to the management-system passage",
    ix.for("ISO/IEC 42001", "2023").get("3.4").title === "management system");
  t("17021-1 3.4 resolves to the certification-audit passage",
    ix.for("ISO/IEC 17021-1", "2015").get("3.4").title === "certification audit");
  /* AND THE SCOPED VIEW CANNOT CROSS: a 17021-1 item asking for a clause 42001 has must MISS. */
  t("a 17021-1 view does NOT see 42001's A.9.3", !ix.for("ISO/IEC 17021-1", "2015").has("A.9.3"));
  t("a 42001 view does see A.9.3", ix.for("ISO/IEC 42001", "2023").has("A.9.3"));

  /* two editions of one standard are two passages */
  t("27000:2018 3.1 and 27000:2022 3.1 differ",
    ix.for("ISO/IEC 27000", "2018").get("3.1").title !== ix.for("ISO/IEC 27000", "2022").get("3.1").title);

  /* the key set a container's children are found in is SCOPED, so a child of another standard cannot match */
  const ks = [...ix.for("ISO/IEC 42001", "2023").keys()];
  t("the scoped key set is bare clauses, not composite keys", ks.includes("A.9.3") && !ks.some((k) => String(k).includes("|")));
  t("the scoped key set excludes other standards", !ks.includes("3.4") || ix.for("ISO/IEC 42001", "2023").get("3.4").title === "management system");

  /* forItem refuses rather than defaulting */
  let threw = false;
  try { ix.forItem({ key_support_clause: "3.4" }); } catch { threw = true; }
  t("forItem refuses an item with no (source, edition)", threw);
  t("forItem scopes by the item's own source",
    ix.forItem({ source_id: "ISO/IEC 17021-1", edition: "2015" }).get("3.4").title === "certification audit");

  /* an empty library is an error, not an empty index */
  let threw2 = false;
  try { makePassageIndex([]); } catch { threw2 = true; }
  t("an empty library throws", threw2);

  /* a miss is undefined, never a cross-standard hit */
  t("an unknown clause misses", ix.for("ISO/IEC 42001", "2023").get("99.99") === undefined);

  return { examined: 11, fails };
}
