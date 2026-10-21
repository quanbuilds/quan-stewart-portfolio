// Opt-in real-provider acceptance. Never prints credentials or model reasoning.
// A short-lived receipt may be reused only for identical source, fixture and checks.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
process.on('uncaughtException',error=>{console.error('Founder acceptance failed:',error.message);process.exit(1);});
const sourceText=await readFile('cloudflare/go/src/audit.js','utf8');
const fixtureText=await readFile('cloudflare/go/test/fixtures/founder-hvac.json','utf8');
const digest=createHash('sha256').update(sourceText).update(fixtureText).update(await readFile(new URL(import.meta.url))).digest('hex');
const cache=process.env.LOKI_MODEL_EVIDENCE;
function verifyReport(report){
 assert(report.ready);assert.equal(report.tools.length,0);assert(report.opportunities.length>=1);
 const plan=JSON.stringify(report).normalize('NFKC').toLowerCase();
 for(const fact of ['melissa','20','tuesday','friday','baseline','next']) assert(plan.includes(fact),'Report lost '+fact);
 assert(/\bhi\b|\bhello\b/.test(plan),'Missing actual opening script');
 assert(!/(?:call|oldest|first) (?:five|six|seven|eight|[5-8])\b/.test(plan),'Invented call quota');
 assert(!/\d+\s*%/.test(plan),'Invented numerical success threshold');
}
function verifyFollowup(followup){
 assert(!followup.ready);const reply=followup.reply.normalize('NFKC').toLowerCase();
 for(const fact of ['melissa','20','tuesday','friday','note','next']) assert(reply.includes(fact),'Follow-up lost '+fact);
 assert(/\bhi\b|\bhello\b/.test(reply));assert(/date|due/.test(reply));
}
if(cache){
 let previous;try{previous=JSON.parse(await readFile(cache,'utf8'));}catch{}
 if(previous?.accepted && previous.sourceDigest===digest && Date.now()-previous.testedAt<15*60*1000){
  verifyReport(previous.report);verifyFollowup(previous.followup);console.log('Reusing exact-source real-provider acceptance:',JSON.stringify(previous));process.exit(0);
 }
}
const auth=JSON.parse(execFileSync('npx',['--yes','--package=wrangler@4.148.0','wrangler','auth','token','--profile','default','--json'],{encoding:'utf8'}));
const credential=auth.token||auth.oauth_token||auth.api_token;
assert(credential,'Existing Cloudflare authorization is unavailable');
let source=sourceText.replace("from './audit-memory.js'",'from '+JSON.stringify('data:text/javascript,'+encodeURIComponent(await readFile('cloudflare/go/src/audit-memory.js','utf8')))).replace('async function generate(','export async function generate(');
const {generate}=await import('data:text/javascript,'+encodeURIComponent(source));
const env={AI:{run:async(model,args)=>{
 const stage=args.messages?.[0]?.content.startsWith('Check whether this advice')?'constraint review':'answer';const started=Date.now();console.log('Provider check started:',stage);
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/58008ae4816f34f96786f0f52834dce5/ai/run/'+model,{method:'POST',headers:{Authorization:'Bearer '+credential,'content-type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(180000)});
 const data=await response.json();console.log('Provider check finished:',stage,Date.now()-started,'ms');
 if(stage==='constraint review' && data.success) console.log('Constraint review:',data.result?.choices?.[0]?.message?.content||data.result?.response);
 if(!data.success) throw Error('Cloudflare model acceptance blocked: '+JSON.stringify(data.errors));return data.result;
}}};
const fixture=JSON.parse(fixtureText);
const turns=fixture.answers.slice(0,6).map(answer=>({reply:'Create eighteen Outlook tasks and a second list.',question:'',answer}));
const report=await generate(env,fixture.hint,turns,{pilot:'Create Outlook tasks and review Tuesday and Thursday.'});
console.log('Founder report:',JSON.stringify(report));verifyReport(report);
turns.push({reply:report.reply,question:'',answer:fixture.answers[6]});
const followup=await generate(env,fixture.hint,turns,report);
console.log('Founder follow-up:',JSON.stringify(followup));verifyFollowup(followup);
const evidence={scenario:'Synthetic founder HVAC regression',accepted:true,sourceDigest:digest,testedAt:Date.now(),report,followup};
if(cache) await writeFile(cache,JSON.stringify(evidence,null,2),{mode:0o600});console.log(JSON.stringify(evidence));
