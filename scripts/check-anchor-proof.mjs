import { createHash } from "node:crypto";

const FN = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/open-badge";
const code = process.argv[2];
if (!code) { console.error("usage: node scripts/check-anchor-proof.mjs <CODE>"); process.exit(2); }

const doc = await (await fetch(
  `https://credentials.certidemy.com/credentials/${code}`,
  { headers: { accept: "application/vc+ld+json" } },
)).text();

const leaf = createHash("sha256").update(Buffer.from(doc, "utf8")).digest("hex");
const a = await (await fetch(`${FN}?doc=anchor&code=${code}`)).json();

if (a.error) {
  console.error(`${code}: ${a.error}`);
  process.exitCode = 1;
} else {
  let h = leaf;
  for (const s of a.path) {
    const pair = s.position === "right"
      ? Buffer.concat([Buffer.from(h, "hex"), Buffer.from(s.hash, "hex")])
      : Buffer.concat([Buffer.from(s.hash, "hex"), Buffer.from(h, "hex")]);
    h = createHash("sha256").update(pair).digest("hex");
  }
  const leafOk = leaf === a.leaf;
  const rootOk = h === a.root;
  console.log(code);
  console.log("  document bytes :", doc.length);
  console.log("  leaf match     :", leafOk);
  console.log("  siblings       :", a.path.length);
  console.log("  ROOT MATCH     :", rootOk);
  console.log("  chain          :", a.chain ?? "(not published yet)");
  process.exitCode = leafOk && rootOk ? 0 : 1;
}