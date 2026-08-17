import jsonld from "jsonld";

const OB3 = "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json";

async function get(url) {
  const r = await fetch(url, { headers: { accept: "application/vc+ld+json" } });
  return JSON.parse(await r.text());
}

async function trial(label, doc) {
  try {
    await jsonld.expand(doc, { safe: true });
    console.log("  PASS  " + label);
    return true;
  } catch (e) {
    const d = e.details?.event?.details;
    const why = d ? JSON.stringify(d) : (e.message || String(e));
    console.log("  FAIL  " + label + "  -> " + why);
    return false;
  }
}

function withCtx(doc, extra) {
  const base = Array.isArray(doc["@context"]) ? doc["@context"] : [doc["@context"]];
  return { ...doc, "@context": [...base, ...extra] };
}

console.log("\n########## ISSUER ##########");
const issuer = await get("https://certidemy.com/issuer");
console.log(JSON.stringify(issuer, null, 2));
console.log("");
await trial("baseline (as served)", issuer);
await trial("+ controller/v1",  withCtx(issuer, ["https://www.w3.org/ns/controller/v1"]));
await trial("+ multikey/v1",    withCtx(issuer, ["https://w3id.org/security/multikey/v1"]));
await trial("+ did/v1",         withCtx(issuer, ["https://www.w3.org/ns/did/v1"]));
{
  const stripped = { ...issuer };
  delete stripped.verificationMethod;
  await trial("verificationMethod removed (isolation check)", stripped);
}

console.log("\n########## STATUS LIST ##########");
const status = await get("https://certidemy.com/status/1");
console.log(JSON.stringify(status, null, 2));
console.log("");
await trial("baseline (as served)", status);
await trial("+ ob3 context", withCtx(status, [OB3]));
{
  const s = JSON.parse(JSON.stringify(status));
  if (s.issuer && typeof s.issuer === "object") delete s.issuer.type;
  await trial("issuer.type dropped", s);
}
{
  const s = JSON.parse(JSON.stringify(status));
  if (s.issuer && typeof s.issuer === "object" && s.issuer.id) s.issuer = s.issuer.id;
  await trial("issuer collapsed to string URL", s);
}