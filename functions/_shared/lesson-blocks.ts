// functions/_shared/lesson-blocks.ts
//
// Parse a lesson's content_md into the shape get_lesson publishes.
//
// ===================== THIS PARSER IS A CONTRACT =====================
//
// The moment it ships, a partner's course builder depends on it, which is why
// get_lesson carries contractVersion from version 1 rather than acquiring one
// later. Changing a block type, a field name, or what is omitted is a version
// bump, not a tidy-up.
//
// It also exists SO THAT THE DIRECTIVE SYNTAX IS NOT THE CONTRACT. Returning raw
// content_md would pin `::concept title="..."` as a public interface, and the
// authoring format could never change again without breaking every partner.
//
// ===================== WHAT IS DELIBERATELY NOT PUBLISHED =====================
//
// ::checkpoint IS OMITTED. Measured on AISM-I: 61 of 61 English lessons carry
// one, 191 items in total, EVERY ONE with a `correct` array and an explanation.
// None appears verbatim in the 1,104-row item bank, so these are formative
// checks rather than leaked exam content -- but they are keyed assessment items
// aligned to the JTA, which is the thing a competitor would otherwise have to
// write. Serving the prose is the decision that was made; serving a question set
// is a different decision, and if it is ever made it is its own scope
// (`courseware:assessments`) rather than a side effect of a format flag.
//
// ::interactive IS ALSO OMITTED, AND THAT DECISION WAS REVERSED ON A MEASUREMENT.
// It was to be included on the reasoning that widget config is scenario text and
// scenario text is teaching material. Measured across all 61 AISM-I English
// lessons, EVERY widget type carries an answer, each under a different name:
//
//   toggle-and-observe   reflection_answer
//   drag-match           correct
//   scenario-mcq         best_path
//   highlight-mistake     is_correct, minimum_correct
//   sort-into-order      correct_order
//
// 61 of 61 lessons carry an ::interactive and all 61 carry a key. So it is not
// teaching material with a scenario; it is ASSESSMENT with a scenario. The
// sample that informed the original decision was a toggle-and-observe excerpt
// that stopped before its reflection_answer -- a sample read as a preview, which
// CLAUDE.md already records as its own failure mode.
//
// A field denylist would be the wrong repair: five names across five widgets
// today, unknown names in the next widget, and a guard searching for STRINGS
// when the property is "is this the answer". Re-including it means a PER-WIDGET
// FIELD ALLOWLIST defaulting to empty, so a new widget publishes nothing until
// someone decides what of it is safe. That is a design, not a flag.
//
// FRONTMATTER IS AN ALLOWLIST, NOT A DENYLIST. The 15 keys present include
// `status` (some lessons read `draft`) and `authors` (real names). A naive
// projection ships both. Anything not named in PUBLISHED_FRONTMATTER is dropped,
// so a key added to the authoring format later is omitted by default rather than
// published by accident.
//
// ===================== THE SYNTAX, MEASURED =====================
//
// Across AISM-I's 61 English lessons: 394 opening directives and 394 bare `::`
// closing lines. Exactly equal, so every block closes, nothing nests, and a
// line-oriented parser is sufficient. Directives seen: hook 61, concept 144,
// callout 6, interactive 61, checkpoint 61, summary 61.

/** Frontmatter keys a partner receives. Everything else is dropped. */
export const PUBLISHED_FRONTMATTER = [
  "title",
  "subtitle",
  "preview",
  "duration_minutes",
  "task_codes",
  "concept_slugs",
  "prerequisites",
] as const;

/**
 * Block types a partner receives. `checkpoint` AND `interactive` are absent on
 * purpose; see the note below on why the second one changed.
 */
export const PUBLISHED_BLOCKS = ["hook", "concept", "callout", "summary"] as const;

export interface LessonBlock {
  type: string;
  title?: string;
  text?: string;
  widget?: string;
  id?: string;
  conceptSlugs?: string[];
  config?: unknown;
  configUnparsed?: boolean;
}

export interface ParsedLesson {
  frontmatter: Record<string, unknown>;
  blocks: LessonBlock[];
  /** What was dropped and how much of it. A reduction the caller cannot see is
   *  the same defect class as a dropped read, so it is reported rather than
   *  silently absorbed -- the caller learns checkpoints EXIST and are withheld,
   *  instead of never learning they exist. */
  omitted: Record<string, number>;
}

/** Attributes on a directive line: key="value", space separated. */
function parseAttrs(rest: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of rest.matchAll(/([a-z_]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

/**
 * Minimal YAML for the four shapes this frontmatter actually uses, and no more:
 *   key: value            scalar
 *   key: [a, b]           inline list
 *   key: |                block scalar, indented continuation
 *   key:                  list, indented `- item` lines
 *
 * A general YAML parser would accept shapes the corpus does not contain and
 * would have to be trusted on them. This handles what is measured to be there.
 */
function parseFrontmatter(src: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const allowed = new Set<string>(PUBLISHED_FRONTMATTER as readonly string[]);
  const lines = src.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const inline = m[2].trim();

    // Indented continuation belongs to this key whether we publish it or not --
    // it must be consumed either way so the next key is read correctly.
    const body: string[] = [];
    let j = i + 1;
    while (j < lines.length && (/^\s+\S/.test(lines[j]) || lines[j].trim() === "")) {
      body.push(lines[j]);
      j++;
    }
    const consumedTo = j - 1;

    if (allowed.has(key)) {
      if (inline === "|" || inline === ">") {
        out[key] = body.map((l) => l.replace(/^\s{2}/, "")).join("\n").trim();
      } else if (inline.startsWith("[") && inline.endsWith("]")) {
        out[key] = inline.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
      } else if (inline === "") {
        const items = body
          .map((l) => l.match(/^\s*-\s*(.+?)\s*$/))
          .filter((x): x is RegExpMatchArray => x !== null)
          .map((x) => x[1]);
        out[key] = items;
      } else {
        const n = Number(inline);
        out[key] = inline !== "" && Number.isFinite(n) && /^-?\d+(\.\d+)?$/.test(inline) ? n : inline;
      }
    }
    i = consumedTo;
  }
  return out;
}

export function parseLesson(contentMd: string): ParsedLesson {
  const src = String(contentMd ?? "");
  const omitted: Record<string, number> = {};
  const blocks: LessonBlock[] = [];

  const fmMatch = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const frontmatter = fmMatch ? parseFrontmatter(fmMatch[1]) : {};
  const rest = fmMatch ? src.slice(fmMatch[0].length) : src;

  const lines = rest.split(/\r?\n/);
  const published = new Set<string>(PUBLISHED_BLOCKS as readonly string[]);

  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^::([a-z-]+)(.*)$/);
    if (!open) continue;
    const type = open[1];
    const attrs = parseAttrs(open[2] ?? "");

    const body: string[] = [];
    let j = i + 1;
    while (j < lines.length && !/^::\s*$/.test(lines[j])) {
      body.push(lines[j]);
      j++;
    }
    i = j; // the closing `::`

    if (!published.has(type)) {
      omitted[type] = (omitted[type] ?? 0) + 1;
      continue;
    }

    const text = body.join("\n").trim();
    if (type === "interactive") {
      let config: unknown = null;
      let configUnparsed = false;
      try {
        config = JSON.parse(text);
      } catch {
        configUnparsed = true;
      }
      blocks.push({
        type,
        ...(attrs.widget ? { widget: attrs.widget } : {}),
        ...(attrs.id ? { id: attrs.id } : {}),
        ...(attrs.concept_slugs
          ? { conceptSlugs: attrs.concept_slugs.split(",").map((s) => s.trim()).filter(Boolean) }
          : {}),
        config,
        ...(configUnparsed ? { configUnparsed: true } : {}),
      });
    } else {
      blocks.push({
        type,
        ...(attrs.title ? { title: attrs.title } : {}),
        text,
      });
    }
  }

  return { frontmatter, blocks, omitted };
}
