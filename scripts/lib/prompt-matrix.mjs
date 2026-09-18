/**
 * prompt-matrix.mjs - assemble the item-writing prompt for a fixed matrix of
 * inputs, and print it as JSON when run directly.
 *
 * THE POINT OF THIS FILE IS THAT IT RUNS UNDER BOTH RUNTIMES, UNCHANGED:
 *
 *   node scripts/lib/prompt-matrix.mjs
 *   deno run --allow-env scripts/lib/prompt-matrix.mjs
 *
 * If the two outputs differ, the rule modules are not portable and the "one
 * source" claim is false however many files there are in the folder. That is
 * the cheap half of check-prompt-parity.mjs; the expensive half asks the
 * DEPLOYED function the same question.
 *
 * ONE IMPORT PATH, and it is the thing under test. Every rule the generators
 * apply must come through here. A rule that is reachable only from a script is
 * a rule the edge function does not have, which is exactly the state this
 * exists to detect.
 */
import { draftSystem } from "../../functions/_shared/item-rules/item-pipeline.mjs";
import { difficultyLineFor, profileFor } from "../../functions/_shared/item-rules/item-profile.mjs";
import { groundingFor } from "../../functions/_shared/item-rules/item-grounding.mjs";

/* Fixed inputs. Real certification names, because `groundingFor` and
 * `profileFor` both route on the name and a synthetic name would exercise only
 * the fallback. Each row is chosen to land on a DIFFERENT branch: if two rows
 * resolved to the same profile and grounding, a routing regression could pass. */
export const MATRIX = [
  { certName: "Scrum Master I - AI", tier: 1, task: { code: "1.1", statement: "Facilitate the Daily Scrum so the Developers inspect progress toward the Sprint Goal.", bloom_level: "3_apply", criticality: "high", knowledge: "The purpose and timebox of the Daily Scrum.", skills: "Facilitating without directing.", abilities: "Recognising when the event has become a status report." } },
  { certName: "Scrum Master II - AI", tier: 2, task: { code: "2.4", statement: "Judge whether an impediment belongs to the Scrum Team or to the organisation.", bloom_level: "4_analyze", criticality: "high", knowledge: "Accountabilities and their boundaries.", skills: "Distinguishing an impediment from a preference.", abilities: "Holding a boundary under pressure." } },
  { certName: "AI Essentials I", tier: 1, task: { code: "2.3", statement: "Recognise when a tool has produced a confident but wrong answer.", bloom_level: "2_understand", criticality: "medium", knowledge: "What a language model does and does not verify.", skills: "Spotting an unsupported claim.", abilities: "Choosing to check before acting." } },
  { certName: "ISO/IEC 27001:2022 Foundation - AI", tier: 1, task: { code: "2.1", statement: "Explain what an ISMS is and the common structure of a management system.", bloom_level: "2_understand", criticality: "high", knowledge: "Policy, objectives, processes and improvement.", skills: "Explaining what a management system adds.", abilities: "Distinguishing a system from a set of controls." } },
  { certName: "ISO/IEC 42001:2023 Internal Auditor", tier: 2, task: { code: "4.12", statement: "Determine whether controls are operated as declared, not merely present.", bloom_level: "4_analyze", criticality: "high", knowledge: "Annex A control families and the Statement of Applicability.", skills: "Tracing a declaration to evidence.", abilities: "Writing a finding that survives review." } },
  { certName: "AI Governance & Risk Management I", tier: 1, task: { code: "3.2", statement: "Apply an escalation rule to a model whose behaviour has drifted.", bloom_level: "3_apply", criticality: "high", knowledge: "Escalation thresholds and who owns them.", skills: "Applying a stated rule to a described case.", abilities: "Acting without over-reaching." } },
];

/** The full assembled prompt for one row, per kind. */
export function assemble() {
  const out = {};
  for (const row of MATRIX) {
    for (const kind of ["secure", "practice"]) {
      const key = row.certName + " | tier " + row.tier + " | " + kind;
      out[key] = {
        system: draftSystem(kind, row.certName, row.task, row.tier),
        profile: profileFor(row.certName, row.tier).id,
        difficulty: difficultyLineFor(kind, row.certName, row.tier),
        grounding_len: groundingFor(row.certName, row.tier).length,
      };
    }
  }
  return out;
}

/* Run directly -> print JSON. Deliberately not pretty-printed: the consumer
 * compares bytes, and an indentation choice is not part of the property. */
const isMain = typeof process !== "undefined" && Array.isArray(process.argv) &&
  process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("prompt-matrix.mjs");
if (isMain) console.log(JSON.stringify(assemble()));
