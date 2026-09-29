import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/audit.js', import.meta.url), 'utf8');
const { handleAudit, sendText } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
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

test('Loki keeps a validated conversation and never claims an unconfigured text was sent', async()=>{
  const ctx=setup(()=>question);
  const start=await handleAudit(request('/api/audit/start',{business:'We operate a small gym'}),ctx.env,new URL(origin+'/api/audit/start'));
  const {id,token}=await start.json();
  const turn=await handleAudit(request('/api/audit/turn',{id,token,answer:'It arrives in a shared email inbox.'}),ctx.env,new URL(origin+'/api/audit/turn'));
  assert.equal(turn.status,200);
  assert.equal(JSON.parse(ctx.rows.get(id).turns_json)[0].answer,'It arrives in a shared email inbox.');
  const text=await handleAudit(request('/api/audit/text-opt-in',{id,token,phone:'5551234567',consent:true}),ctx.env,new URL(origin+'/api/audit/text-opt-in'));
  assert.equal(text.status,409);
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

test('Loki only accepts a provider message receipt, not an HTTP success alone', async()=>{
  const original=globalThis.fetch;
  const env={SENDBLUE_API_KEY:'test',SENDBLUE_API_SECRET:'test',SENDBLUE_NUMBER:'+15550000000'};
  try {
    globalThis.fetch=async()=>Response.json({status:'QUEUED',message_handle:'msg_123'});
    assert.deepEqual(await sendText(env,'+15551111111','Hello'),{ok:true,receipt:'msg_123'});
    globalThis.fetch=async()=>Response.json({status:'ERROR',message_handle:'msg_456'});
    assert.equal((await sendText(env,'+15551111111','Hello')).ok,false);
    globalThis.fetch=async()=>Response.json({status:'QUEUED'});
    assert.equal((await sendText(env,'+15551111111','Hello')).ok,false);
  } finally { globalThis.fetch=original; }
});
