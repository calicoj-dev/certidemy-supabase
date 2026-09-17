import { readFileSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFS, sourcesAvailable } from "file:///C:/Users/Juan/Documents/certidemy/supabase/scripts/lib/citation-index.mjs";
import { preservesObligation, checkFaithful } from "file:///C:/Users/Juan/Documents/certidemy/supabase/scripts/lib/obligation-guard.mjs";
/* The batch is a parameter: `node gen-lesson-repair-spec-aimsf.mjs <out.json>
 * <repairs-module>`. One generator, one applier, one data file per batch -- so
 * a batch can be re-read on its own without the machinery around it. */
const MOD = process.argv[3] ?? "./lesson-repairs-aimsf.mjs";
const { REPAIRS } = await import(new URL(MOD, "file:///C:/Users/Juan/Documents/certidemy/supabase/scripts/").href);
for (const line of readFileSync("scripts/.env","utf8").split(/\r?\n/)) {
  const m=/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]]=m[2].replace(/^["']|["']$/g,"");
}
const K=process.env.SUPABASE_SERVICE_ROLE_KEY, H={apikey:K,Authorization:"Bearer "+K};
async function g(p){let l;for(let i=0;i<12;i++){try{const r=await fetch("https://pctynukndxnmnxiqpgck.supabase.co/rest/v1/"+p,{headers:H,signal:AbortSignal.timeout(60000)});const t=await r.text();if(!r.ok)throw new Error(r.status+t.slice(0,120));return JSON.parse(t);}catch(e){l=e}}throw l}
const norm=s=>String(s||"").toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9' ]+/g," ").replace(/\s+/g," ").trim();
function pdf(p){const o=join(mkdtempSync(join(tmpdir(),"i-")),"t.txt");execFileSync("pdftotext",["-layout",p,o]);return readFileSync(o,"utf8");}
if(!sourcesAvailable()){console.error("no standards");process.exit(2);}
const gb=checkFaithful(); if(gb.length){console.error("guard control failed");process.exit(1);}
const G=new Set();
for(const p of Object.values(PDFS)){const w=norm(pdf(p)).split(" ").filter(Boolean);if(w.length<1000){console.error("short");process.exit(1);}for(let i=0;i+5<=w.length;i++)G.add(w.slice(i,i+5).join(" "));}
function lr(t){const w=norm(t).split(" ").filter(Boolean);let b=0,bt="";for(let i=0;i+5<=w.length;i++){if(!G.has(w.slice(i,i+5).join(" ")))continue;let n=5;while(i+n+1<=w.length&&G.has(w.slice(i+n+1-5,i+n+1).join(" ")))n++;if(n>b){b=n;bt=w.slice(i,i+n).join(" ");}i+=n-1;}return{b,bt};}
function lineSpans(md){const s=[];const re=/\r?\n/g;let st=0,m;while((m=re.exec(md))!==null){s.push([st,m.index]);st=m.index+m[0].length;}s.push([st,md.length]);return s;}
const T=(await g("mcp_leak_policy?select=threshold_words"))[0].threshold_words;
const certs=await g("certifications?select=id,code");
/* THE CERTIFICATION COMES FROM THE BATCH FILE, not from this script's name.
 * Every repair entry already carries `cert`, and hardcoding AIMS-F here meant
 * the first AIMS-IA batch reported "lesson not found" five times -- a message
 * that names the lesson when the lesson was there and the CERTIFICATION was
 * wrong. Same shape as the tasks.knowledge type error this morning. */
const CERT_CODE = REPAIRS[0]?.cert || "AIMS-F";
if (REPAIRS.some(r => r.cert !== CERT_CODE)) {
  console.error("this batch mixes certifications: " + [...new Set(REPAIRS.map(r=>r.cert))].join(", "));
  process.exit(2);
}
const id=certs.find(c=>c.code===CERT_CODE).id;
const mods=await g("modules?select=id&certification_id=eq."+id);
const rows=await g("lessons?select=id,slug,language,content_md&language=eq.en&module_id=in.("+mods.map(m=>m.id).join(",")+")");
const entries=[],problems=[];
console.log("");
for(const r of REPAIRS){
  const row=rows.find(x=>x.slug===r.slug);
  if(!row){problems.push(r.slug+": lesson not found");continue;}
  const spans=[r.en,...(r.also??[])];
  let md=row.content_md, fail=null, touched=[];
  for(const sp of spans){
    if(!md.includes(sp.before)){ if(md.includes(sp.after)){touched.push("(done)");continue;} fail="span not present: \""+sp.before.slice(0,50)+"...\""; break; }
    const ob=preservesObligation(sp.before,sp.after,"en");
    /* An override is a RECORDED JUDGEMENT, not a switch: it carries its reason,
     * it prints loudly, and it excuses only the entry it sits on. */
    if(!ob.ok && !r.obligation_override){fail="OBLIGATION -- "+ob.reason+" ("+ob.before.strong+"/"+ob.before.weak+" -> "+ob.after.strong+"/"+ob.after.weak+")";break;}
    if(!ob.ok) console.log("      [OVERRIDE] "+r.slug+": "+r.obligation_override);
    md=md.replace(sp.before,sp.after);
    touched.push(ob.before.strong+"/"+ob.before.weak+"->"+ob.after.strong+"/"+ob.after.weak);
  }
  if(fail){problems.push(r.slug+": "+fail);console.log("  REFUSED "+r.slug+": "+fail);continue;}
  const b4=lr(row.content_md).b, af=lr(md);
  if(af.b>=T){problems.push(r.slug+": still leaks "+af.b+"w -- \""+af.bt.slice(0,64)+"\"");console.log("  REFUSED "+r.slug+": still leaks "+af.b+"w");continue;}
  // emit as line entries for apply-marking-spec
  const oldS=lineSpans(row.content_md), newS=lineSpans(md);
  if(oldS.length!==newS.length){problems.push(r.slug+": line count changed");continue;}
  const langs={};
  let n=0;
  for(let i=0;i<oldS.length;i++){
    const a=row.content_md.slice(...oldS[i]), b=md.slice(...newS[i]);
    if(a!==b){ langs["en"+(n?"_"+n:"")]={lesson_id:row.id,line_abs:i,before:a,after:b}; n++; }
  }
  if(!n){problems.push(r.slug+": nothing changed");continue;}
  for(const [k,v] of Object.entries(langs)) entries.push({cert:CERT_CODE,slug:r.slug,block:"-",block_index:-1,line_index:v.line_abs,run_words:0,run:r.address,needs_authoring:false,languages:{en:v}});
  console.log("  "+r.slug.padEnd(44)+spans.length+" span  leak "+String(b4).padStart(2)+"w -> "+String(af.b).padStart(2)+"w  oblig "+touched.join(" ")+"  ("+n+" line(s))");
}
console.log("");
console.log("entries "+entries.length+"   problems "+problems.length);
for(const p of problems) console.log("  X "+p);
if(!problems.length){ writeFileSync(process.argv[2],JSON.stringify({generated:"aimsf-lessons-batch1",threshold_words:T,entries,blocked:[]},null,1)+"\n"); console.log("\nspec -> "+process.argv[2]); }
else process.exitCode=1;
