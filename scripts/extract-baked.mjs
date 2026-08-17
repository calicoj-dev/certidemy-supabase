import { readFileSync } from "node:fs";
import jsonld from "jsonld";

const buf = readFileSync(process.argv[2]);
const s = buf.toString("latin1");
const at = s.indexOf("openbadgecredential");
if (at < 0) { console.error("no openbadgecredential chunk"); process.exit(1); }

// PNG chunk: [4 len][4 type][data][4 crc].  `at` is the start of DATA, because
// the keyword is the first field of an iTXt payload.
const dataLen  = buf.readUInt32BE(at - 8);
const dataEnd  = at + dataLen;
// keyword(19) + null + compFlag + compMethod + null(lang) + null(translated)
const textStart = at + "openbadgecredential".length + 5;

console.log("chunk type    :", buf.toString("latin1", at - 4, at));
console.log("chunk dataLen :", dataLen);

const json = buf.toString("utf8", textStart, dataEnd);
console.log("extracted     :", json.length, "bytes");
console.log("last 40 chars :", JSON.stringify(json.slice(-40)));

const doc = JSON.parse(json);
console.log("");
console.log("id            :", doc.id);
console.log("issuer        :", doc.issuer?.id);
console.log("cryptosuite   :", doc.proof?.cryptosuite);
console.log("verifyMethod  :", doc.proof?.verificationMethod);
console.log("statusList    :", doc.credentialStatus?.statusListCredential);
console.log("has identifier:", Array.isArray(doc.credentialSubject?.identifier));
console.log("alignments    :", doc.credentialSubject?.achievement?.alignment?.length);

await jsonld.expand(doc, { safe: true });
console.log("SAFE MODE      PASS");