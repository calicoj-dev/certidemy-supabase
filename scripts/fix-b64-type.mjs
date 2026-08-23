import fs from "node:fs";
const DRY = process.argv.includes("--dry");
const P = "functions/resend-webhook/index.ts";
const OLD = "function b64ToBytes(b64: string): Uint8Array {";
const NEW = "function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {";
const buf = fs.readFileSync(P);
if (buf[0] === 0xef) { console.error("ABORT: BOM"); process.exit(1); }
const src = buf.toString("utf8");
if (src.includes(NEW)) { console.log("already applied"); process.exit(0); }
if (!src.includes(OLD)) { console.error("ABORT: anchor not found"); process.exit(1); }
const out = src.split(OLD).join(NEW);
if (!out.includes(NEW)) { console.error("ABORT: replacement absent"); process.exit(1); }
if (DRY) { console.log("--dry: nothing written"); process.exit(0); }
fs.writeFileSync(P, out, "utf8");
const chk = fs.readFileSync(P, "utf8");
if (!chk.includes(NEW)) { console.error("ABORT: post-condition failed"); process.exit(1); }
console.log("ok: b64ToBytes returns Uint8Array<ArrayBuffer>");