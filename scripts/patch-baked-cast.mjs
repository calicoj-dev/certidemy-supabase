import { readFileSync, writeFileSync } from "node:fs";
const DRY = process.argv.includes("--dry");
const PATH = "functions/open-badge/index.ts";
let src = readFileSync(PATH, "utf8");
const before = src.length;

const FIND = "        return new Response(baked, {";
const REPL = `        // Deno 2.x tightened Uint8Array's generic: BodyInit wants
        // Uint8Array<ArrayBuffer>, and concat() produces ArrayBufferLike.
        // Response accepts the bytes at runtime. Same cast as credential-og.
        return new Response(baked as unknown as BodyInit, {`;

const n = src.split(FIND).length - 1;
if (n !== 1) { console.error("ABORT matched " + n); process.exit(3); }
src = src.replace(FIND, REPL);

if (!src.includes("baked as unknown as BodyInit")) { console.error("ABORT post-check"); process.exit(3); }
console.log(`  ${before} -> ${src.length} bytes`);
if (DRY) { console.log("DRY RUN"); process.exit(2); }
writeFileSync(PATH, src, "utf8");
console.log("written");