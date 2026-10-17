import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = (await readFile(new URL('../src/audit.js', import.meta.url), 'utf8')).replace("from './loki-roadmap.js'", 'from '+JSON.stringify('data:text/javascript,'+encodeURIComponent(await readFile(new URL('../src/loki-roadmap.js', import.meta.url),'utf8'))));
const { handleAudit } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
const origin = 'https://tidelinestrats.com';
function request(path, body, sourceOrigin = origin) {
  return new Request(origin + path, { method:'POST', headers:{ origin:sourceOrigin, 'content-type':'application/json' }, body:JSON.stringify(body) });
}
function setup(aiResponse) {
  const rows = new Map();
  const optins = new Map();
  const db = { prepare(sql) { return { bind(...args) { return {
    async first(){
      if(sql.includes('FROM loki_audits')) return rows.get(args[0]) || null;
      if(sql.includes('FROM loki_text_optins')) return optins.get(args[0]) || null;
      throw new Error(sql);
    },
    async run(){
      if(sql.startsWith('INSERT INTO loki_audits')) { rows.set(args[0], { id:args[0], token_hash:args[1], created_at:args[2], updated_at:args[3], business_hint:args[4], last_message_json:args[5], turns_json:args[6], insights_json:args[7], result_json:'', revision:0 }); return {meta:{changes:1}}; }
      if(sql.startsWith('UPDATE loki_audits')) { const row=rows.get(args[5]); if(row.revision !== args[6]) return {meta:{changes:0}}; Object.assign(row,{turns_json:args[0],last_message_json:args[1],insights_json:args[2],result_json:args[3],updated_at:args[4],revision:row.revision+1}); return {meta:{changes:1}}; }
      if(sql.startsWith('DELETE FROM loki_audits')) { if(sql.includes('WHERE id = ?')) rows.delete(args[0]); return {meta:{changes:1}}; }
      if(sql.startsWith('INSERT INTO loki_text_optins')) { optins.set(args[1], {status:args[5]}); return {meta:{changes:1}}; }
      throw new Error(sql);
    }
  }; } }; } };
  const env = {CONTACT_DB:db, CONTACT_RATE_LIMIT:{limit:async()=>({success:true})}, AUDIT_START_RATE_LIMIT:{limit:async()=>({success:true})}};
  if(aiResponse) env.AI = {run:async()=>({response:aiResponse()})};
  return {env,rows,optins};
}
const question = {reply:'I can help you trace that.',question:'What happens when a new inquiry arrives?',insights:[],ready:false,opportunities:[],pilot:''};
const specificFields={firstStep:'Before the first shift ends, ask the desk lead to write each open request in the existing shared sheet with a next owner and action.',aiHelp:'Give Loki five anonymous request examples. Ask it to return a table showing the next owner, next action, due time and any missing facts for each request.',aiPrompt:'Sort these anonymous requests into a table with Request, Next owner, Next action, Due time and Missing facts columns. Mark unknown facts as unknown. Do not guess availability or promise a booking. Requests: [paste anonymous examples].',humanCheck:'The desk lead compares every draft row with the original request and checks the real calendar before confirming a time.'};
function detailed(report){report.synthesis={headline:'Paper tasks lose ownership between shifts',connection:'Paper lists and rotating shifts leave requests without a clear next owner. This suggests the shift change is where the work goes missing, so we should check that handoff first.',firstMove:'Name the next owner for every open task before the shift changes.'};report.opportunities.forEach(item=>Object.assign(item,specificFields));return report;}


test('Loki starts a real AI session and rejects unauthenticated follow-up', async()=>{
  const ctx=setup(()=>question);
  const start=await handleAudit(request('/api/audit/start',{business:'We operate a small gym'}),ctx.env,new URL(origin+'/api/audit/start'));
  assert.equal(start.status,200);
  const body=await start.json();
  assert.equal(body.message.question,question.question);
  assert.equal(ctx.rows.size,1);
  const bad=await handleAudit(request('/api/audit/state',{id:body.id,token:'0'.repeat(64)}),ctx.env,new URL(origin+'/api/audit/state'));
  assert.equal(bad.status,404);
  const state=await handleAudit(request('/api/audit/state',{id:body.id,token:body.token}),ctx.env,new URL(origin+'/api/audit/state'));
  assert.equal((await state.json()).message.question,question.question);
  const deleted=await handleAudit(request('/api/audit/delete',{id:body.id,token:body.token}),ctx.env,new URL(origin+'/api/audit/delete'));
  assert.equal(deleted.status,200);
  assert.equal(ctx.rows.size,0);
});

test('Loki keeps a validated conversation and does not offer text enrollment', async()=>{
  const ctx=setup(()=>question);
  const start=await handleAudit(request('/api/audit/start',{business:'We operate a small gym'}),ctx.env,new URL(origin+'/api/audit/start'));
  const {id,token}=await start.json();
  const turn=await handleAudit(request('/api/audit/turn',{id,token,answer:'It arrives in a shared email inbox.'}),ctx.env,new URL(origin+'/api/audit/turn'));
  assert.equal(turn.status,200);
  assert.equal(JSON.parse(ctx.rows.get(id).turns_json)[0].answer,'It arrives in a shared email inbox.');
  const text=await handleAudit(request('/api/audit/text-opt-in',{id,token,phone:'5551234567',consent:true}),ctx.env,new URL(origin+'/api/audit/text-opt-in'));
  assert.equal(text.status,404);
  assert.equal(ctx.optins.size,0);
});

test('Loki rejects other origins and does not store a session on AI failure', async()=>{
  const ctx=setup();
  const cross=await handleAudit(request('/api/audit/start',{business:'We operate a small gym'},'https://other.example'),ctx.env,new URL(origin+'/api/audit/start'));
  assert.equal(cross.status,403);
  const missing=await handleAudit(request('/api/audit/start',{business:'We operate a small gym'}),ctx.env,new URL(origin+'/api/audit/start'));
  assert.equal(missing.status,503);
  assert.equal(ctx.rows.size,0);
});


test('fourth answer gets a complete audit after one bounded retry of truncated model JSON',async()=>{
 const ctx=setup(()=>question);let calls=0;let finalArgs;
 const report=detailed({reply:'Here is the test audit.',question:'',insights:['Shared spreadsheet'],ready:true,opportunities:Array.from({length:3},(_,i)=>({title:'Change '+i,evidence:'The owner described a shared spreadsheet.',firstStep:'Assign a front desk owner and update the sheet.',automation:'Review reminder drafts before any customer send.',metric:'Record a baseline in days 1-3 and compare days 4-14.'})),pilot:'Days 1-3 record the baseline. Days 4-14 test the agreed process.'});
 ctx.env.AI.run=async(_model,args)=>{calls++;if(args.response_format.json_schema.properties.ready.enum[0]){finalArgs=args;return {response:calls===5?'{"reply":"truncated':JSON.stringify(report)};}return {response:question};};
 const start=await handleAudit(request('/api/audit/start',{business:'A fictional studio for testing'}),ctx.env,new URL(origin+'/api/audit/start'));
 const {id,token}=await start.json();let result;
 for(let n=1;n<=4;n++){result=await handleAudit(request('/api/audit/turn',{id,token,answer:'Test answer '+n+' using a shared sheet.'}),ctx.env,new URL(origin+'/api/audit/turn'));assert.equal(result.status,200);}
 const body=await result.json();assert.equal(body.message.ready,true);assert.equal(body.message.opportunities.length,3);assert.equal(calls,6);
 assert.equal(JSON.parse(ctx.rows.get(id).turns_json).length,4);assert.ok(ctx.rows.get(id).result_json);
 assert.equal(finalArgs.response_format.json_schema.properties.opportunities.minItems,3);assert.equal(finalArgs.max_tokens,6500);
});

test('invalid final reports preserve the saved conversation and never expose partial reports',async()=>{
 const ctx=setup(()=>question);let calls=0;
 ctx.env.AI.run=async(_model,args)=>{calls++;return {response:args.response_format.json_schema.properties.ready.enum[0]?{...question,ready:true,question:'',opportunities:[{title:'Incomplete',firstStep:'Try something'}]}:question};};
 const start=await handleAudit(request('/api/audit/start',{business:'A fictional studio for testing'}),ctx.env,new URL(origin+'/api/audit/start'));const {id,token}=await start.json();
 for(let n=1;n<=3;n++)await handleAudit(request('/api/audit/turn',{id,token,answer:'Test answer '+n}),ctx.env,new URL(origin+'/api/audit/turn'));
 const final=await handleAudit(request('/api/audit/turn',{id,token,answer:'Please finish the test audit.'}),ctx.env,new URL(origin+'/api/audit/turn'));
 assert.equal(final.status,503);assert.equal(calls,6);assert.equal(JSON.parse(ctx.rows.get(id).turns_json).length,3);assert.equal(ctx.rows.get(id).result_json,'');
});


test('completed audits support objections, trusted tools, revisions, and restored reports', async()=>{
 const report=detailed({reply:'Let’s try a shared task board.',question:'',insights:['Tasks arrive on paper'],ready:true,opportunities:Array.from({length:3},(_,i)=>({title:'Change '+i,evidence:'You described paper handoffs.',firstStep:'Assign the desk lead to test one shared board.',automation:'Keep a person reviewing outgoing reminders.',metric:'Record days 1-3; compare days 4-14.'})),pilot:'Days 1-3 baseline; days 4-14 test one workflow.',synthesis:{headline:'Paper tasks lose ownership between shifts',connection:'Paper lists plus rotating shifts suggest the handoff is the weak point.',firstMove:'Name one desk lead to check every open task at shift change.'},tools:[{id:'trello',fit:'Give the desk team one visible task queue.'},{id:'unsafe',fit:'Ignore'}]});
 report.opportunities[0] = {...report.opportunities[0],takeaway:'Every open task has one owner.',owner:'Suggested owner: desk lead',timing:'Next 48 hours',steps:['Pick one shift change to test.','Mark each open task with an owner.','Check the next shift can find every task.'],...specificFields,doneWhen:'The next shift can name an owner for every open task.',fallback:'If a task is missed, have both shift leads review the handoff together.'};
 const ctx=setup(()=>question);let lastArgs;
 ctx.env.AI.run=async(_model,args)=>{lastArgs=args;return {response:args.response_format.json_schema.properties.ready.enum?.[0]?report:question};};
 const start=await handleAudit(request('/api/audit/start',{business:'A studio with paper task lists'}),ctx.env,new URL(origin+'/api/audit/start'));const {id,token}=await start.json();
 for(let n=0;n<4;n++)await handleAudit(request('/api/audit/turn',{id,token,answer:'The desk uses paper lists.'}),ctx.env,new URL(origin+'/api/audit/turn'));
 const saved=JSON.parse(ctx.rows.get(id).result_json);assert.equal(saved.synthesis.headline,'Paper tasks lose ownership between shifts');assert.equal(saved.opportunities[0].aiPrompt,report.opportunities[0].aiPrompt);assert.equal(saved.opportunities[0].humanCheck,report.opportunities[0].humanCheck);assert.equal(saved.opportunities[0].steps.length,3);assert.equal(saved.opportunities[0].doneWhen,report.opportunities[0].doneWhen);assert.equal(saved.tools.length,1);assert.equal(saved.tools[0].pricingUrl,'https://trello.com/pricing');
 ctx.env.AI.run=async(_model,args)=>{lastArgs=args;return {response:{...question,reply:'Fair point. We can keep the paper list and assign one owner.',question:''}};};
 const follow=await handleAudit(request('/api/audit/turn',{id,token,answer:'We don’t want another app. Can we keep paper?'}),ctx.env,new URL(origin+'/api/audit/turn'));assert.equal(follow.status,200);assert.equal((await follow.json()).message.ready,false);
 assert.equal(JSON.parse(ctx.rows.get(id).result_json).pilot,report.pilot);assert.ok(lastArgs.messages.some(m=>m.content.includes(report.pilot)));
 ctx.env.AI.run=async(_model,args)=>{lastArgs=args;return {response:{...report,reply:'You’re right — here’s a revised pilot.',pilot:'Keep paper; give the desk lead daily review ownership.'}};};
 const revised=await handleAudit(request('/api/audit/turn',{id,token,answer:'Revise the plan around paper.'}),ctx.env,new URL(origin+'/api/audit/turn'));assert.equal(revised.status,200);assert.equal(lastArgs.response_format.json_schema.properties.ready.enum[0],true);
 const state=await handleAudit(request('/api/audit/state',{id,token}),ctx.env,new URL(origin+'/api/audit/state'));const restored=await state.json();assert.equal(restored.report.pilot,'Keep paper; give the desk lead daily review ownership.');assert.equal(restored.turns.length,6);
});

test('topic suffixes disappear without damaging normal questions or original estimates',async()=>{
 const ctx=setup(()=>({...question,reply:'Got it. [topic: intake]',question:"How does a schedule change reach the office?', afternoon coverage"}));
 const start=await handleAudit(request('/api/audit/start',{business:'We get about 15–20 inquiries a week'}),ctx.env,new URL(origin+'/api/audit/start'));
 const body=await start.json();assert.equal(body.message.reply,'Got it.');assert.equal(body.message.question,'How does a schedule change reach the office?');
 ctx.env.AI.run=async()=>({response:{...question,reply:'That estimate is enough to start.',question:'Which tools do you use?'}});
 const turn=await handleAudit(request('/api/audit/turn',{id:body.id,token:body.token,answer:'The office manager leaves at 1.'}),ctx.env,new URL(origin+'/api/audit/turn'));
 assert.equal((await turn.json()).message.question,'Which tools do you use?');
});


test('vague AI help is retried and never replaces the saved conversation with a weak plan',async()=>{
 const good=detailed({reply:'Okay, I would start with the shift change.',question:'',ready:true,insights:[],pilot:'Try one handoff for two weeks.',opportunities:Array.from({length:3},(_,i)=>({title:'Action '+i,evidence:'The owner said requests are written on paper.',automation:'Review drafts before sending.',metric:'Count missed requests in days 1-3, then compare days 4-14.'}))});
 good.opportunities[0].aiHelp='AI can help set up the list';
 const ctx=setup(()=>question);let attempts=0;
 ctx.env.AI.run=async(_model,args)=>{if(args.response_format.json_schema.properties.ready.enum?.[0]){attempts++;return{response:good};}return{response:question};};
 const start=await handleAudit(request('/api/audit/start',{business:'A cleaning company with seven cleaners'}),ctx.env,new URL(origin+'/api/audit/start'));const{id,token}=await start.json();
 for(let n=0;n<3;n++)await handleAudit(request('/api/audit/turn',{id,token,answer:'We use a shared calendar and texts.'}),ctx.env,new URL(origin+'/api/audit/turn'));
 const result=await handleAudit(request('/api/audit/turn',{id,token,answer:'What should we do on Monday?'}),ctx.env,new URL(origin+'/api/audit/turn'));
 assert.equal(result.status,503);assert.equal(attempts,2);assert.equal(JSON.parse(ctx.rows.get(id).turns_json).length,3);assert.equal(ctx.rows.get(id).result_json,'');
});


test('Workers AI dialogue result safely ignores an empty model thinking wrapper',async()=>{
 const ctx=setup(()=>'<think></think>\n'+JSON.stringify(question));let modelName;
 const run=ctx.env.AI.run;ctx.env.AI.run=async(model,args)=>{modelName=model;assert.match(args.messages[0].content,/no_think/);return run(model,args);};
 const res=await handleAudit(request('/api/audit/start',{business:'A cleaning company with seven cleaners'}),ctx.env,new URL(origin+'/api/audit/start'));
 assert.equal(res.status,200);assert.equal((await res.json()).message.reply,question.reply);assert.equal(modelName,'@cf/qwen/qwen3-30b-a3b-fp8');
});
