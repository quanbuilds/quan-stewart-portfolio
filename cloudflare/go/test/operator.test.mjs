import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const auditSource = await readFile(new URL('../src/audit.js', import.meta.url), 'utf8');
const auditUrl = `data:text/javascript,${encodeURIComponent(auditSource)}`;
const source = (await readFile(new URL('../src/operator.js', import.meta.url), 'utf8'))
  .replace("from './audit.js'", `from ${JSON.stringify(auditUrl)}`);
const { handleOperator, refreshOperatorMoves } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
const host = 'https://tidelinestrats.com';
const aiMove = { title:'Triage new inquiries', evidence:'Based on your description of a shared inbox.', action:'Review three recent inquiry timestamps and draft a same-day reply checklist for the owner to approve.', metric:'Record the current median reply delay and compare it with the next three inquiries.', question:'Who checks the shared inbox each afternoon?' };

function setup() {
  const owners = new Map(), moves = new Map(), chats = new Map();
  const db = { async batch(statements){return Promise.all(statements.map(stmt=>stmt.run()));}, prepare(sql) { return { bind(...args) { return {
    async first() {
      if (sql.startsWith('SELECT * FROM loki_operators')) return owners.get(args[0]) || null;
      if (sql.startsWith('SELECT result_json FROM loki_audits')) return null;
      return null;
    },
    async all() {
      if (sql.startsWith('SELECT id, created_at, title')) return { results:[...moves.values()].filter(m=>m.operator_id===args[0]).sort((a,b)=>b.created_at.localeCompare(a.created_at)) };
      if (sql.startsWith('SELECT id, role, content')) return { results:[...chats.values()].filter(m=>m.operator_id===args[0]).sort((a,b)=>b.created_at.localeCompare(a.created_at)) };
      if (sql.startsWith('SELECT o.* FROM loki_operators')) return { results:[...owners.values()].filter(o=>![...moves.values()].some(m=>m.operator_id===o.id && m.status==='open') && o.updated_at<args[0]) };
      throw new Error(sql);
    },
    async run() {
      if (sql.startsWith('INSERT INTO loki_operators')) { owners.set(args[0], {id:args[0],token_hash:args[1],created_at:args[2],updated_at:args[3],business:args[4],goal:args[5],audit_id:args[6],notes:''}); return {meta:{changes:1}}; }
      if (sql.startsWith('INSERT INTO loki_moves')) { moves.set(args[0], {id:args[0],operator_id:args[1],created_at:args[2],title:args[3],evidence:args[4],action:args[5],metric:args[6],question:args[7],status:'open',outcome:'',resolved_at:''}); return {meta:{changes:1}}; }
      if (sql.startsWith('INSERT INTO loki_messages')) { chats.set(args[0],{id:args[0],operator_id:args[1],role:args[2],content:args[3],created_at:args[4]});return {meta:{changes:1}}; }
      if (sql.startsWith('UPDATE loki_moves')) { const m=moves.get(args[3]); if(!m || m.operator_id!==args[4] || m.status!=='open') return {meta:{changes:0}}; Object.assign(m,{status:args[0],outcome:args[1],resolved_at:args[2]}); return {meta:{changes:1}}; }
      if (sql.startsWith('UPDATE loki_operators SET notes')) {Object.assign(owners.get(args[2]),{notes:args[0],updated_at:args[1]});return {meta:{changes:1}};}
      if (sql.startsWith('UPDATE loki_operators SET goal')) {Object.assign(owners.get(args[2]),{goal:args[0],updated_at:args[1]});return {meta:{changes:1}};}
      if (sql.startsWith('UPDATE loki_operators SET updated_at')) {owners.get(args[1]).updated_at=args[0];return {meta:{changes:1}};}
      if (sql.startsWith('DELETE FROM loki_moves')) {for(const [id,m] of moves) if(m.operator_id===args[0]) moves.delete(id);return {meta:{changes:1}};}
      if (sql.startsWith('DELETE FROM loki_messages')) {for(const [id,m] of chats) if(m.operator_id===args[0]) chats.delete(id);return {meta:{changes:1}};}
      if (sql.startsWith('DELETE FROM loki_operators')) {owners.delete(args[0]);return {meta:{changes:1}};}
      throw new Error(sql);
    }
  }; } }; } };
  const env = { CONTACT_DB:db, CONTACT_RATE_LIMIT:{limit:async()=>({success:true})}, AUDIT_START_RATE_LIMIT:{limit:async()=>({success:true})}, AI:{run:async(_,options)=>({response:options.response_format ? aiMove : 'Try a simple afternoon inbox review. Who owns it today?'})} };
  return {env,owners,moves,chats};
}
function req(path, method='GET', body, session, origin=host) {
  const headers = { origin };
  if(body) headers['content-type']='application/json';
  if(session){headers.authorization='Bearer '+session.token;headers['x-loki-owner']=session.id;}
  return new Request(host+path,{method,headers,body:body?JSON.stringify(body):undefined});
}
const call=(request,env)=>handleOperator(request,env,new URL(request.url));

test('owner starts, resumes, reports outcome, receives next move, and deletes private history',async()=>{
  const {env,owners,moves,chats}=setup();
  const rejected=await call(req('/api/operator/start','POST',{business:'Neighborhood gym',goal:'Respond to leads faster'},null,'https://attacker.test'),env);
  assert.equal(rejected.status,403);
  const started=await call(req('/api/operator/start','POST',{business:'Neighborhood gym',goal:'Respond to leads faster'}),env);
  assert.equal(started.status,200);
  const session=await started.json();
  assert.equal(moves.size,1);
  assert.equal((await call(req('/api/operator/state'),env)).status,401);
  assert.equal((await call(req('/api/operator/state','GET',null,{...session,token:'0'.repeat(64)}),env)).status,401);
  const state=await call(req('/api/operator/state','GET',null,session),env);
  assert.equal((await state.json()).moves[0].title,aiMove.title);
  const chat=await call(req('/api/operator/message','POST',{message:'How should I start today?'},session),env);
  assert.equal(chat.status,200);
  assert.equal((await chat.json()).messages.length,2);
  const first=session.moves[0];
  const closed=await call(req('/api/operator/outcome','POST',{moveId:first.id,status:'done',outcome:'Two of three people replied today.'},session),env);
  assert.equal(closed.status,200);
  const next=await call(req('/api/operator/next','POST',{},session),env);
  assert.equal(next.status,200);
  assert.equal(moves.size,2);
  const deleted=await call(req('/api/operator/delete','DELETE',null,session),env);
  assert.equal(deleted.status,200);
  assert.equal(owners.size,0);
  assert.equal(moves.size,0);
  assert.equal(chats.size,0);
});

test('daily refresh only creates a move after an owner has resolved the current one',async()=>{
  const {env,owners,moves}=setup();
  const session=await (await call(req('/api/operator/start','POST',{business:'Neighborhood gym',goal:'Respond to leads faster'}),env)).json();
  assert.equal(await refreshOperatorMoves(env),0);
  await call(req('/api/operator/outcome','POST',{moveId:session.moves[0].id,status:'done',outcome:'We measured a two day delay.'},session),env);
  owners.get(session.id).updated_at=new Date(Date.now()-24*60*60*1000).toISOString();
  assert.equal(await refreshOperatorMoves(env),1);
  assert.equal(moves.size,2);
  assert.equal(await refreshOperatorMoves(env),0);
});
