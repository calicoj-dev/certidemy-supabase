import { readFileSync, writeFileSync } from "node:fs";
import { createHash as ch } from "node:crypto";
for (const line of readFileSync("scripts/.env","utf8").split(/\r?\n/)) {
  const m=/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]]=m[2].replace(/^["']|["']$/g,"");
}
const K=process.env.SUPABASE_SERVICE_ROLE_KEY, H={apikey:K,Authorization:"Bearer "+K};
async function g(p){for(let i=0;i<12;i++){try{const r=await fetch("https://pctynukndxnmnxiqpgck.supabase.co/rest/v1/"+p,{headers:H,signal:AbortSignal.timeout(60000)});return JSON.parse(await r.text());}catch{}}throw new Error(p)}
const md5=s=>ch("md5").update(s,"utf8").digest("hex").slice(0,8);
const LESSONS={"ISMS-F":["02-09-pdca-and-improvement","05-02-internal-audit","02-03-amendment-1-2024"],
 "AIMS-F":["05-06-integrated-audit-programme","01-02-determining-your-roles","04-07-control-overlap-with-27001","03-08-clause-8-operational-duties","01-05-drivers-and-what-certification-means","05-05-the-certification-route","02-07-risk-versus-impact"]};
const certs=await g("certifications?select=id,code");
const out=[];
for(const [code,slugs] of Object.entries(LESSONS)){
  const id=certs.find(c=>c.code===code).id;
  const mods=await g("modules?select=id&certification_id=eq."+id);
  const rows=await g("lessons?select=id,slug,language,lesson_group_id,content_md&module_id=in.("+mods.map(m=>m.id).join(",")+")");
  for(const slug of slugs){
    const grp=rows.filter(r=>r.slug===slug);
    const en=grp.find(r=>r.language==="en");
    for(const lang of ["es-419","pt-BR"]){
      const r=grp.find(x=>x.language===lang); if(!r) continue;
      out.push({kind:"lesson",surface:"lessons.content_md",cert:code,slug,language:lang,
        lesson_id:r.id,en_hash:md5(en.content_md),
        english_now:en.content_md.length>4000?"(long -- read the row)":en.content_md,
        translation_now:r.content_md.length>4000?"(long -- read the row)":r.content_md,
        clear_sql:"insert into public.lesson_translation_reviews (lesson_id, reviewed_by, en_hash, verdict) values ('"+r.id+"', 'juan', '"+md5(en.content_md)+"', 'approved');"});
    }
  }
}
const bp=JSON.parse(readFileSync("BILINGUAL-QUEUE-blueprint.json","utf8"));
for(const e of bp.entries) out.push({kind:"blueprint",surface:"tasks.knowledge",...e});
// Spanish first, then Portuguese; lessons before blueprint within each
const order=x=>(x.language==="es-419"?0:1)*10+(x.kind==="lesson"?0:1);
out.sort((a,b)=>order(a)-order(b)||String(a.cert).localeCompare(String(b.cert))||String(a.slug??a.task).localeCompare(String(b.slug??b.task)));
writeFileSync("BILINGUAL-QUEUE.json", JSON.stringify({
  purpose:"54 rows needing a bilingual read before they can be served. SPANISH FIRST -- es-419 is what the Mexican partner pulls. No instrument here can check these: the leak index is English ISO text, so every row below scores zero before and after. What is being looked for is ISO's own Spanish or Portuguese sentence reproduced in a translation, which only a reader with the standard can see.",
  spanish_rows: out.filter(x=>x.language==="es-419").length,
  portuguese_rows: out.filter(x=>x.language==="pt-BR").length,
  lesson_rows: out.filter(x=>x.kind==="lesson").length,
  blueprint_rows: out.filter(x=>x.kind==="blueprint").length,
  total: out.length, entries: out
},null,1)+"\n");
console.log("es-419 "+out.filter(x=>x.language==="es-419").length+"   pt-BR "+out.filter(x=>x.language==="pt-BR").length+
  "   lessons "+out.filter(x=>x.kind==="lesson").length+"   blueprint "+out.filter(x=>x.kind==="blueprint").length+"   TOTAL "+out.length);
