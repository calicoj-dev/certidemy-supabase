// Does jsonld canonicalize under Deno's edge runtime, with NO network?
import jsonld from "npm:jsonld@8.3.2";

const OB3 = "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json";
const VC2 = "https://www.w3.org/ns/credentials/v2";

const res = await fetch("https://credentials.certidemy.com/credentials/SM-AI-I-ZZMV-JPC8");
const doc = await res.json();

// Pre-fetch the contexts so the loader below never touches the network -- this
// is exactly what bundling them would look like in production.
const cache = {};
for (const url of [OB3, VC2]) {
  const r = await fetch(url, { headers: { accept: "application/ld+json" } });
  cache[url] = await r.json();
  console.log("cached", url, JSON.stringify(cache[url]).length, "bytes");
}

const loader = (url) => {
  if (!cache[url]) throw new Error("NETWORK ATTEMPT: " + url);
  return { contextUrl: null, document: cache[url], documentUrl: url };
};

const unsigned = { ...doc };
delete unsigned.proof;

console.time("canonize");
const nquads = await jsonld.canonize(unsigned, {
  algorithm: "URDNA2015",
  format: "application/n-quads",
  documentLoader: loader,
});
console.timeEnd("canonize");

console.log("n-quads bytes:", nquads.length);
console.log("first line   :", nquads.split("\n")[0]);