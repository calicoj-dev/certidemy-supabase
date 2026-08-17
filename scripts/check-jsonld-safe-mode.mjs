import jsonld from "jsonld";

const URLS = process.argv.slice(2);
if (URLS.length === 0) {
  console.error("usage: node check-jsonld-safe-mode.mjs <url> [url...]");
  process.exit(2);
}

let failures = 0;

for (const url of URLS) {
  console.log("\n=== " + url);
  let res;
  try {
    res = await fetch(url, {
      headers: { accept: "application/vc+ld+json, application/ld+json, application/json" }
    });
  } catch (e) {
    console.log("  FETCH ERROR  " + e.message);
    failures++;
    continue;
  }

  console.log("  status       " + res.status);
  console.log("  content-type " + (res.headers.get("content-type") || "(none)"));
  if (!res.ok) { failures++; continue; }

  const text = await res.text();
  console.log("  bytes        " + text.length);

  let doc;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    console.log("  JSON PARSE   FAIL " + e.message);
    failures++;
    continue;
  }

  const ctx = doc["@context"];
  console.log("  contexts     " + (Array.isArray(ctx) ? ctx.filter(c => typeof c === "string").join(" | ") : String(ctx)));

  const proofs = Array.isArray(doc.proof) ? doc.proof : (doc.proof ? [doc.proof] : []);
  if (proofs.length) {
    console.log("  proof        " + proofs.map(p => (p.cryptosuite || p.type || "?")).join(", "));
  }

  try {
    await jsonld.expand(doc, { safe: true });
    console.log("  SAFE MODE    PASS");
  } catch (e) {
    failures++;
    console.log("  SAFE MODE    FAIL");
    console.log("    " + (e.message || String(e)));
    if (e.details) {
      console.log("    " + JSON.stringify(e.details, null, 2).slice(0, 3000));
    }
  }
}

console.log("\nfailures: " + failures);
process.exit(failures === 0 ? 0 : 1);