import jsonld from "jsonld";
const OB3 = "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json";

const r = await fetch("https://certidemy.com/status/1", { headers: { accept: "application/vc+ld+json" } });
const status = JSON.parse(await r.text());
console.log(JSON.stringify(status, null, 2));

async function trial(label, doc) {
  try { await jsonld.expand(doc, { safe: true }); console.log("  PASS  " + label); }
  catch (e) {
    const d = e.details?.event?.details;
    console.log("  FAIL  " + label + "  -> " + (d ? JSON.stringify(d) : (e.message || String(e))));
  }
}

console.log("");
await trial("baseline", status);
await trial("+ ob3 context", { ...status, "@context": [...status["@context"], OB3] });
{ const s = JSON.parse(JSON.stringify(status)); delete s.issuer.type; await trial("issuer.type dropped", s); }
{ const s = JSON.parse(JSON.stringify(status)); s.issuer = s.issuer.id; await trial("issuer as bare URL", s); }
console.log("done");