import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const moduleURL=name=>'data:text/javascript,'+encodeURIComponent(readFileSync(new URL('../src/'+name+'.js',import.meta.url),'utf8'));
const memoryURL=moduleURL('audit-memory');
const source=readFileSync(new URL('../src/audit.js',import.meta.url),'utf8').replace("from './audit-memory.js'",'from '+JSON.stringify(memoryURL)).replace("from './loki-roadmap.js'",'from '+JSON.stringify(moduleURL('loki-roadmap')));
const {handleAudit}=await import('data:text/javascript,'+encodeURIComponent(source));
const {memoryStatements}=await import(memoryURL);
function adapter(sql){return {
 prepare(query){let args=[];return {bind(...values){args=values;return this;},async first(){return sql.prepare(query).get(...args)||null;},async run(){return {meta:{changes:sql.prepare(query).run(...args).changes}};},async all(){return {results:sql.prepare(query).all(...args)};}};},
 async batch(statements){sql.exec('BEGIN');try{const r=[];for(const statement of statements)r.push(await statement.run());sql.exec('COMMIT');return r;}catch(error){sql.exec('ROLLBACK');throw error;}}
};}
function fixture(){
 const local=new DatabaseSync(':memory:'),crm=new DatabaseSync(':memory:');
 for(const migration of ['0002_loki_audits.sql','0005_audit_memory.sql']) local.exec(readFileSync(new URL('../migrations/'+migration,import.meta.url),'utf8'));
 crm.exec('CREATE TABLE documents (collection TEXT,id TEXT,data_json TEXT,updated_at INTEGER,revision INTEGER DEFAULT 1,PRIMARY KEY(collection,id))');
 const env={CONTACT_DB:adapter(local),CRM_DB:adapter(crm),CONTACT_RATE_LIMIT:{limit:async()=>({success:true})},AUDIT_START_RATE_LIMIT:{limit:async()=>({success:true})},AI:{run:async()=>({response:{reply:'Let us check that.',question:'Where do requests arrive?',ready:false,insights:[]}})}};
 const call=async(path,body)=>{const url=new URL('https://tidelinestrats.com/api/audit/'+path);return handleAudit(new Request(url,{method:'POST',headers:{origin:url.origin,'content-type':'application/json'},body:JSON.stringify(body)}),env,url);};
 return {local,crm,env,call};
}
async function start(ctx){const res=await ctx.call('start',{business:'A hypothetical property management business'});return res.json();}
test('email save links CRM once, keeps memory fresh and restores only with the audit capability',async()=>{
 const ctx=fixture(),s=await start(ctx),auth={id:s.id,token:s.token};
 assert.equal((await (await ctx.call('state',auth)).json()).saved,false);
 const payload={...auth,email:'Owner@Example.com',consent:true};
 for(let i=0;i<2;i++){const saved=await ctx.call('save',payload);assert.equal(saved.status,200);assert.match((await saved.json()).workspacePath,/^customers\/loki-contact-[a-f0-9]+\/loki\//);}
 assert.equal(ctx.crm.prepare("SELECT count(*) n FROM documents WHERE collection='contacts'").get().n,1);
 assert.equal(ctx.crm.prepare("SELECT count(*) n FROM documents WHERE collection='notes'").get().n,1);
 assert.equal(ctx.local.prepare('SELECT count(*) n FROM loki_memory_files').get().n,4);
 const state=await (await ctx.call('state',auth)).json();assert.equal(state.saved,true);assert.equal(state.email,'owner@example.com');
 ctx.env.AI.run=async()=>({response:{reply:'The shared inbox gives us a starting point.',question:'Who handles requests after lunch?',ready:false,insights:[]}});
 assert.equal((await ctx.call('turn',{...auth,answer:'We use one shared inbox.'})).status,200);
 const memory=ctx.local.prepare("SELECT content FROM loki_memory_files WHERE path LIKE '%owner-facts.json'").get();assert.deepEqual(JSON.parse(memory.content).answers,['We use one shared inbox.']);
 assert.equal((await ctx.call('state',{id:s.id,token:'0'.repeat(64),email:payload.email})).status,404);
 const other=await start(ctx);await ctx.call('save',{id:other.id,token:other.token,email:payload.email,consent:true});
 const otherState=await (await ctx.call('state',{id:other.id,token:other.token})).json();assert.equal(otherState.turns.length,0);assert.notEqual(otherState.workspacePath,state.workspacePath);
 assert.equal(ctx.crm.prepare("SELECT count(*) n FROM documents WHERE collection='contacts'").get().n,1);
 assert.equal((await ctx.call('delete',auth)).status,200);assert.equal(ctx.local.prepare('SELECT count(*) n FROM loki_memory_files WHERE audit_id=?').get(s.id).n,0);assert.equal(ctx.local.prepare('SELECT count(*) n FROM loki_audit_saves WHERE audit_id=?').get(s.id).n,0);
});
test('save preserves staff-edited contacts, requires consent, and fails honestly if CRM is unavailable',async()=>{
 const ctx=fixture(),s=await start(ctx),auth={id:s.id,token:s.token};
 ctx.crm.prepare('INSERT INTO documents VALUES (?,?,?,?,?)').run('contacts','staff-contact',JSON.stringify({name:'Real contact',email:'owner@example.com',oppId:'existing-account',notes:'Keep staff edits'}),1,4);
 assert.equal((await ctx.call('save',{...auth,email:'owner@example.com'})).status,400);
 assert.equal((await ctx.call('save',{...auth,email:'invalid',consent:true})).status,400);
 const res=await ctx.call('save',{...auth,email:'owner@example.com',consent:true});assert.equal(res.status,200);
 const c=JSON.parse(ctx.crm.prepare("SELECT data_json FROM documents WHERE id='staff-contact'").get().data_json);assert.equal(c.notes,'Keep staff edits');assert.equal(c.name,'Real contact');
 assert.equal(ctx.crm.prepare("SELECT count(*) n FROM documents WHERE collection='opps'").get().n,0);
 assert.equal((await ctx.call('save',{...auth,email:'other@example.com',consent:true})).status,409);
 const another=await start(ctx);delete ctx.env.CRM_DB;assert.equal((await ctx.call('save',{id:another.id,token:another.token,email:'new@example.com',consent:true})).status,503);
 assert.equal(ctx.local.prepare('SELECT count(*) n FROM loki_audit_saves WHERE audit_id=?').get(another.id).n,0);
});
