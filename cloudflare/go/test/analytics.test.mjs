import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const auditUrl='data:text/javascript,'+encodeURIComponent(readFileSync(new URL('../src/audit.js',import.meta.url),'utf8').replace("from './audit-memory.js'",'from '+JSON.stringify('data:text/javascript,'+encodeURIComponent(readFileSync(new URL('../src/audit-memory.js',import.meta.url),'utf8')))).replace("from './loki-roadmap.js'",'from '+JSON.stringify('data:text/javascript,'+encodeURIComponent(readFileSync(new URL('../src/loki-roadmap.js',import.meta.url),'utf8')))));
const source=readFileSync(new URL('../src/analytics.js',import.meta.url),'utf8').replace("from './audit.js'",`from ${JSON.stringify(auditUrl)}`);
const {collectAnalytics,expireAnalytics}=await import('data:text/javascript,'+encodeURIComponent(source));
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../migrations/0004_site_analytics.sql',import.meta.url),'utf8'));
 const env={CONTACT_RATE_LIMIT:{limit:async()=>({success:true})},CONTACT_DB:{prepare(q){let args=[];return {bind(...a){args=a;return this;},async run(){return {meta:{changes:sql.prepare(q).run(...args).changes}};}};}}};
 const event={id:crypto.randomUUID(),session:crypto.randomUUID(),kind:'page_view',page:'home',device:'desktop',referrer:'https://example.com/path?invite=secret'};
 const call=(data=event,headers={},method='POST')=>collectAnalytics(new Request('https://tidelinestrats.com/api/analytics/events',{method,headers:{origin:'https://tidelinestrats.com','content-type':'application/json',...headers},...(method==='POST'?{body:JSON.stringify(data)}:{})}),env);
 return {sql,env,event,call};
}
test('events are deduplicated and retain no form text, full referrer URL, or credential',async()=>{
 const {sql,event,call}=fixture();
 assert.equal((await call({...event,message:'private text',token:'private token'})).status,202);
 assert.equal((await (await call()).json()).saved,false);
 const rows=sql.prepare('SELECT * FROM site_events').all();assert.equal(rows.length,1);assert.equal(rows[0].referrer_host,'example.com');
 assert.doesNotMatch(JSON.stringify(rows),/private|secret|invite|\/path/);
});
test('analytics rejects cross-origin, arbitrary event data, oversized input and honors privacy opt-outs',async()=>{
 const {sql,event,call}=fixture();
 assert.equal((await call(event,{origin:'https://other.example'})).status,403);
 assert.equal((await call({...event,kind:'read_customer_records'})).status,400);
 assert.equal((await call({...event,page:'/invite/private-token'})).status,400);
 assert.equal((await call({...event,message:'x'.repeat(7000)})).status,400);
 assert.equal((await call(event,{},'GET')).status,405);
 assert.equal((await call(event,{'sec-gpc':'1'})).status,202);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM site_events').get().n,0);
});
test('90-day retention removes only expired traffic events',async()=>{
 const {sql,env,call}=fixture();await call();sql.prepare('UPDATE site_events SET created_at=?').run('2020-01-01T00:00:00.000Z');
 await expireAnalytics(env);assert.equal(sql.prepare('SELECT COUNT(*) n FROM site_events').get().n,0);
 await call();await expireAnalytics(env);assert.equal(sql.prepare('SELECT COUNT(*) n FROM site_events').get().n,1);
});
