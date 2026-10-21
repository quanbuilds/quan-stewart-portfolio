import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePhone,receiveWaitlist} from '../src/waitlist.js';
test('normalizes local and international numbers and rejects malformed input',()=>{
 assert.equal(normalizePhone('(312) 555-0123'),'+13125550123');
 assert.equal(normalizePhone('+44 7700 900123'),'+447700900123');
 for(const phone of ['abc3125550123','123','+012345678','3125550123 x42','+131255501234']) assert.equal(normalizePhone(phone),null);
});
test('waitlist validates origin and consent, deduplicates normalized phone, never sends',async()=>{
 const rows=new Set();let sends=0;
 const env={CONTACT_RATE_LIMIT:{limit:async()=>({success:true})},CONTACT_DB:{prepare:sql=>({bind:(phone)=>({run:async()=>{assert.match(sql,/INSERT OR IGNORE/);rows.add(phone);}})})},EMAIL:{send:()=>{sends++;}}};
 const url=new URL('https://tidelinestrats.com/api/loki/waitlist');
 const request=(phone,consent=true,origin=url.origin)=>new Request(url,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({phone,consent})});
 assert.equal((await receiveWaitlist(request('3125550123',false),env,url)).status,400);
 assert.equal((await receiveWaitlist(request('3125550123',true,'https://example.com'),env,url)).status,403);
 assert.equal((await receiveWaitlist(request('3125550123'),env,url)).status,200);
 assert.equal((await receiveWaitlist(request('+1 (312) 555-0123'),env,url)).status,200);
 assert.equal(rows.size,1);assert.equal(sends,0);
 const oversized=new Request(url,{method:'POST',headers:{origin:url.origin,'content-type':'application/json'},body:' '.repeat(2049)});
 assert.equal((await receiveWaitlist(oversized,env,url)).status,413);
});
