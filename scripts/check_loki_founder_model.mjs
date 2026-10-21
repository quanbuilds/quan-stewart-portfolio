// Opt-in real-provider acceptance. Uses existing Wrangler authorization; prints
// final synthetic advice only, never credentials or model reasoning.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
const auth=JSON.parse(execFileSync('npx',['--yes','--package=wrangler@4.148.0','wrangler','auth','token','--profile','default','--json'],{encoding:'utf8'}));
const credential=auth.token||auth.oauth_token||auth.api_token;
assert(credential,'Existing Cloudflare authorization is unavailable');
let source=await readFile('cloudflare/go/src/audit.js','utf8');
source=source.replace("from './audit-memory.js'",'from '+JSON.stringify('data:text/javascript,'+encodeURIComponent(await readFile('cloudflare/go/src/audit-memory.js','utf8')))).replace('async function generate(','export async function generate(');
const {generate}=await import('data:text/javascript,'+encodeURIComponent(source));
const env={AI:{run:async(model,args)=>{
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/58008ae4816f34f96786f0f52834dce5/ai/run/'+model,{method:'POST',headers:{Authorization:'Bearer '+credential,'content-type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(180000)});
 const data=await response.json();
 if(!data.success) throw Error('Cloudflare model acceptance blocked: '+JSON.stringify(data.errors));
 return data.result;
}}};
const fixture=JSON.parse(await readFile('cloudflare/go/test/fixtures/founder-hvac.json','utf8'));
const turns=fixture.answers.slice(0,6).map(answer=>({reply:'Create eighteen Outlook tasks and a second list.',question:'',answer}));
const report=await generate(env,fixture.hint,turns,{pilot:'Create Outlook tasks and review Tuesday and Thursday.'});
assert(report.ready);assert.equal(report.tools.length,0);assert(report.opportunities.length>=1);
const plan=JSON.stringify(report).normalize('NFKC').toLowerCase();
for(const fact of ['melissa','20','tuesday','friday','baseline','next']) assert(plan.includes(fact),'Report lost '+fact);
assert(/\bhi\b|\bhello\b/.test(plan),'Missing actual opening script');
assert(!/(?:call|oldest|first) (?:five|six|seven|eight|[5-8])\b/.test(plan),'Invented call quota');
assert(!/\d+\s*%/.test(plan),'Invented numerical success threshold');
turns.push({reply:report.reply,question:'',answer:fixture.answers[6]});
const followup=await generate(env,fixture.hint,turns,report);
assert(!followup.ready);const reply=followup.reply.normalize('NFKC').toLowerCase();
for(const fact of ['melissa','20','tuesday','friday','note','next']) assert(reply.includes(fact),'Follow-up lost '+fact);
assert(/\bhi\b|\bhello\b/.test(reply));assert(/date|due/.test(reply));
const evidence={scenario:'Synthetic founder HVAC regression',report,followup};
if(process.env.LOKI_MODEL_EVIDENCE) await writeFile(process.env.LOKI_MODEL_EVIDENCE,JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence));
