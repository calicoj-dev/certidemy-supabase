const FN="https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const CERTS=["AIE-I","AIGRM-I","AIHR-I","AIMS-F","AIMS-IA","AISM-I","ISMS-F","ISMS-IA","SD-AI-I","SM-AI-I","SM-AI-II","SPO-AI-I"];
const LANGS=["en","es-419","pt-BR"]; const Q={en:"risk","es-419":"riesgo","pt-BR":"risco"};
async function once(b){try{const r=await fetch(FN,{method:"POST",headers:{"content-type":"application/json","x-mcp-client":"rec-probe"},body:JSON.stringify(b),signal:AbortSignal.timeout(45000)});return r.status;}catch{return 0;}}
async function burst(n){for(let i=0;i<n;i++) await once({resource:"certification",certification:CERTS[i%12],language:"en"});}
async function sweep(){const st={};for(const c of CERTS)for(const l of LANGS)for(const res of ["certification","task","concept","search","lesson_index"]){
  const b={resource:res,certification:c,language:l}; if(res==="search")b.query=Q[l]; if(res!=="certification")b.limit=50;
  const s=await once(b); st[s]=(st[s]||0)+1; await sleep(250);} return st;}
await sleep(90000);
for(const gap of [60,45]){
  console.log("burst of 120, then wait "+gap+"s, then the full sweep");
  await burst(120);
  await sleep(gap*1000);
  console.log("  gap "+gap+"s -> "+JSON.stringify(await sweep()));
  await sleep(120000);
}
