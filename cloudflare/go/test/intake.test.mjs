import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {syncIntake,reconcileIntakes,recordConversion} from '../src/intake.js';import worker from '../src/index.js';
function adapter(sql){return {prepare(query){let args=[];return {bind(...values){args=values;return this;},async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)};},async run(){return {meta:{changes:Number(sql.prepare(query).run(...args).changes)}};}};},async batch(statements){sql.exec('BEGIN');try{const result=[];for(const stmt of statements)result.push(await stmt.run());sql.exec('COMMIT');return result;}catch(error){sql.exec('ROLLBACK');throw error;}}};}
function fixture(){
 const site=new DatabaseSync(':memory:'),crm=new DatabaseSync(':memory:');
 for(const name of ['0001_contact_inquiries.sql','0004_site_analytics.sql','0007_loki_waitlist.sql','0008_intake_conversions.sql'])site.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 crm.exec('CREATE TABLE documents(collection TEXT,id TEXT,data_json TEXT,updated_at INTEGER,PRIMARY KEY(collection,id))');
 const env={CONTACT_DB:adapter(site),CRM_DB:adapter(crm),CONTACT_RATE_LIMIT:{limit:async()=>({success:true})}};
 const addContact=(id,email='owner@example.invalid',phone='+13125550123')=>site.prepare('INSERT INTO contact_inquiries(id,submitted_at,name,business,email,phone,message) VALUES (?,?,?,?,?,?,?)').run(id,new Date().toISOString(),'Synthetic founder','Synthetic service business',email,phone,'Please discuss our follow-up workflow.');
 const docs=collection=>crm.prepare('SELECT id,data_json FROM documents WHERE collection=?').all(collection).map(r=>({id:r.id,...JSON.parse(r.data_json)}));
 return {site,crm,env,addContact,docs};
}
test('contact intake links once, appends new source notes, and preserves staff CRM edits',async()=>{
 const {env,site,crm,addContact,docs}=fixture();const id=crypto.randomUUID();addContact(id);
 const a=await syncIntake(env,'contact',id);assert.equal(a.status,'linked');assert.equal((await syncIntake(env,'contact',id)).oppId,a.oppId);
 assert.equal(docs('contacts').length,1);assert.equal(docs('notes').length,1);
 const account=docs('opps')[0];crm.prepare('UPDATE documents SET data_json=? WHERE collection=? AND id=?').run(JSON.stringify({...account,stage:3,notes:'Staff edit'}),'opps',account.id);
 const next=crypto.randomUUID();addContact(next,'OWNER@example.invalid');assert.equal((await syncIntake(env,'contact',next)).oppId,a.oppId);
 assert.equal(docs('opps').length,1);assert.equal(docs('notes').length,2);assert.equal(docs('opps')[0].stage,3);assert.equal(docs('opps')[0].notes,'Staff edit');
 assert.equal(site.prepare("SELECT count(*) n FROM crm_intake_receipts WHERE status='linked'").get().n,2);
});
test('phone-only waitlist reuses a known normalized phone and keeps consent limited',async()=>{
 const {env,site,addContact,docs}=fixture();const id=crypto.randomUUID();addContact(id);await syncIntake(env,'contact',id);
 site.prepare('INSERT INTO loki_waitlist(phone,submitted_at) VALUES (?,?)').run('+13125550123',new Date().toISOString());
 assert.equal((await syncIntake(env,'waitlist','+13125550123')).status,'linked');assert.equal(docs('contacts').length,1);assert.equal(docs('opps').length,1);assert.equal(docs('notes').length,2);
 assert.match(docs('notes').find(n=>n.title==='Loki launch waitlist').text,/Launch-notification consent only/);
});
test('CRM outages retain the original lead and reconcile without a second contact or note',async()=>{
 const {env,site,addContact,docs}=fixture();const id=crypto.randomUUID();addContact(id);const real=env.CRM_DB;env.CRM_DB={prepare(){throw Error('offline')}};
 assert.equal((await syncIntake(env,'contact',id)).status,'pending');assert.equal(site.prepare('SELECT count(*) n FROM contact_inquiries').get().n,1);
 env.CRM_DB=real;await reconcileIntakes(env);await reconcileIntakes(env);assert.equal(docs('contacts').length,1);assert.equal(docs('notes').length,1);assert.equal(site.prepare('SELECT status FROM crm_intake_receipts').get().status,'linked');
});
test('ambiguous email/phone identity needs review and never merges or edits accounts',async()=>{
 const {env,crm,addContact,docs}=fixture();const id=crypto.randomUUID();addContact(id);
 for(const n of [1,2])crm.prepare('INSERT INTO documents VALUES (?,?,?,?)').run('contacts','c'+n,JSON.stringify({oppId:'a'+n,email:'owner@example.invalid'}),1);
 assert.equal((await syncIntake(env,'contact',id)).status,'review');assert.equal(docs('contacts').length,2);assert.equal(docs('opps').length,0);assert.equal(docs('notes').length,0);
});
test('conversion receipts deduplicate source, honor privacy and cannot store identity or text',async()=>{
 const {env,site}=fixture();const request=new Request('https://tidelinestrats.com/api/contact');const context={session:crypto.randomUUID(),device:'desktop',email:'private@example.invalid',token:'private-token'};
 await recordConversion(env,request,context,'contact_submitted','private-source-id');await recordConversion(env,request,{...context,session:crypto.randomUUID()},'contact_submitted','private-source-id');
 for(const headers of [{'dnt':'1'},{'sec-gpc':'1'}])await recordConversion(env,new Request(request,{headers}),context,'waitlist_joined','other');
 const data=site.prepare('SELECT * FROM conversion_events').all();assert.equal(data.length,1);assert.doesNotMatch(JSON.stringify(data),/private|email|token/);
});
test('real public handlers wire CRM and successful conversion receipts without SMS',async()=>{
 const {env,site,docs}=fixture();const analytics={session:crypto.randomUUID(),device:'phone'};
 const call=(path,body)=>worker.fetch(new Request('https://tidelinestrats.com'+path,{method:'POST',headers:{origin:'https://tidelinestrats.com','content-type':'application/json'},body:JSON.stringify(body)}),env);
 const body={requestId:crypto.randomUUID(),name:'Synthetic owner',business:'Synthetic service',email:'owner@example.invalid',message:'Please respond to this inquiry.',analytics};
 assert.equal((await call('/api/contact',body)).status,202);await call('/api/contact',body);
 assert.equal((await call('/api/loki/waitlist',{phone:'2025550102',consent:true,analytics})).status,200);await call('/api/loki/waitlist',{phone:'+1 (202) 555-0102',consent:true,analytics});
 assert.equal(docs('contacts').length,2);assert.equal(docs('notes').length,2);assert.equal(site.prepare('SELECT count(*) n FROM conversion_events').get().n,2);
 await call('/api/loki/waitlist',{phone:'2025550103',consent:true,website:'spam',analytics});assert.equal(docs('contacts').length,2);
});
