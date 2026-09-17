import { readFileSync, writeFileSync } from "node:fs";
import { createHash as ch } from "node:crypto";
for (const line of readFileSync("scripts/.env","utf8").split(/\r?\n/)) {
  const m=/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]]=m[2].replace(/^["']|["']$/g,"");
}
const K=process.env.SUPABASE_SERVICE_ROLE_KEY, H={apikey:K,Authorization:"Bearer "+K};
async function g(p){for(let i=0;i<12;i++){try{const r=await fetch("https://pctynukndxnmnxiqpgck.supabase.co/rest/v1/"+p,{headers:H,signal:AbortSignal.timeout(60000)});return JSON.parse(await r.text());}catch{}}throw new Error(p)}
const md5=s=>ch("md5").update(s,"utf8").digest("hex").slice(0,8);
/* THE LIST COMES FROM THE FLAG, NOT FROM A HAND-MAINTAINED ARRAY.
 *
 * This held sixteen slugs and was edited by hand after every batch. It went
 * stale once already -- regenerated at 66 while the committed file still said
 * 54 -- and a queue that undercounts is worse than no queue, because the
 * reviewer finishes it and believes they are done.
 *
 * `mcp_translation_review_required` is set by a database trigger at the moment
 * an English leak repair lands, so reading it cannot lag the work. */
const flagged = await g("lessons?select=id,slug,language,lesson_group_id,content_md&mcp_translation_review_required=is.true");
const groupIds = [...new Set(flagged.map(r => r.lesson_group_id))].filter(Boolean);
const certs=await g("certifications?select=id,code");
const out=[];
const certs2 = await g("certifications?select=id,code");
const mods2  = await g("modules?select=id,certification_id");
const modCert = new Map(mods2.map(m => [m.id, (certs2.find(c => c.id === m.certification_id) || {}).code]));
// The English sibling of each flagged group, for the hash and the diff.
const ens = {};
for (const gid of groupIds) {
  const r = await g("lessons?select=id,slug,content_md,module_id,lesson_group_id&language=eq.en&lesson_group_id=eq." + gid);
  if (r[0]) ens[gid] = r[0];
}
for (const r of flagged) {
  const en = ens[r.lesson_group_id];
  if (!en) continue;
  out.push({kind:"lesson", surface:"lessons.content_md",
    cert: modCert.get(en.module_id) || "?", slug: r.slug, language: r.language,
    lesson_id: r.id, en_hash: md5(en.content_md),
    english_now: en.content_md.length > 4000 ? "(long -- read the row)" : en.content_md,
    translation_now: r.content_md.length > 4000 ? "(long -- read the row)" : r.content_md,
    clear_sql: "insert into public.lesson_translation_reviews (lesson_id, reviewed_by, en_hash, verdict) values ('" + r.id + "', 'juan', '" + md5(en.content_md) + "', 'approved');"});
}
const bp=JSON.parse(readFileSync("BILINGUAL-QUEUE-blueprint.json","utf8"));
for(const e of bp.entries) out.push({kind:"blueprint",surface:"tasks.knowledge",...e});
// Spanish first, then Portuguese; lessons before blueprint within each
const order=x=>(x.language==="es-419"?0:1)*10+(x.kind==="lesson"?0:1);
out.sort((a,b)=>order(a)-order(b)||String(a.cert).localeCompare(String(b.cert))||String(a.slug??a.task).localeCompare(String(b.slug??b.task)));
writeFileSync("BILINGUAL-QUEUE.json", JSON.stringify({
  purpose:"rows needing a bilingual read before they can be served. SPANISH FIRST -- es-419 is what the Mexican partner pulls. No instrument here can check these: the leak index is English ISO text, so every row below scores zero before and after. What is being looked for is ISO's own Spanish or Portuguese sentence reproduced in a translation, which only a reader with the standard can see.",
  spanish_rows: out.filter(x=>x.language==="es-419").length,
  portuguese_rows: out.filter(x=>x.language==="pt-BR").length,
  lesson_rows: out.filter(x=>x.kind==="lesson").length,
  blueprint_rows: out.filter(x=>x.kind==="blueprint").length,
  total: out.length, entries: out
},null,1)+"\n");
console.log("es-419 "+out.filter(x=>x.language==="es-419").length+"   pt-BR "+out.filter(x=>x.language==="pt-BR").length+
  "   lessons "+out.filter(x=>x.kind==="lesson").length+"   blueprint "+out.filter(x=>x.kind==="blueprint").length+"   TOTAL "+out.length);
