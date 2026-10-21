import { parseBody } from './audit.js';
const kinds = new Set(['page_view','section_view','audit_open','app_open','contact_open']);
const pages = new Set(['home','audit','services','about','contact','app']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (status, body) => Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function collectAnalytics(request,env) {
  if(request.method!=='POST')return json(405,{ok:false,error:'method_not_allowed'});
  if(request.headers.get('origin')!==new URL(request.url).origin)return json(403,{ok:false,error:'origin_not_allowed'});
  if(request.headers.get('sec-gpc')==='1'||request.headers.get('dnt')==='1')return json(202,{ok:true,saved:false});
  try {if(!(await env.CONTACT_RATE_LIMIT.limit({key:'analytics:'+ (request.headers.get('cf-connecting-ip')||'unknown')})).success)return json(429,{ok:false,error:'rate_limited'});}
  catch{return json(503,{ok:false,error:'analytics_unavailable'});}
  const input=await parseBody(request);
  if(!input||!uuid.test(input.id)||!uuid.test(input.session)||!kinds.has(input.kind)||!pages.has(input.page)||!['phone','tablet','desktop'].includes(input.device))return json(400,{ok:false,error:'invalid_event'});
  let host='';
  try{host=new URL(input.referrer).hostname.slice(0,200);}catch{}
  // Drop everything except this allowlisted schema; no raw message, URL query or owner token.
  try{
    const saved=await env.CONTACT_DB.prepare('INSERT OR IGNORE INTO site_events (id,created_at,kind,page,session_id,referrer_host,device) VALUES (?,?,?,?,?,?,?)').bind(input.id,new Date().toISOString(),input.kind,input.page,input.session,host,input.device).run();
    return json(202,{ok:true,saved:saved.meta?.changes===1});
  }catch{return json(503,{ok:false,error:'analytics_unavailable'});}
}
export async function expireAnalytics(env){
  await env.CONTACT_DB.prepare('DELETE FROM wonplace_site_events WHERE created_at < ?').bind(new Date(Date.now()-90*86400000).toISOString()).run();
  await env.CONTACT_DB.prepare('DELETE FROM site_events WHERE created_at < ?').bind(new Date(Date.now()-90*86400000).toISOString()).run();
}

// Public marketing events are isolated from TideLine traffic and real app activity.
export async function collectWonplaceAnalytics(request, env) {
 const origin=request.headers.get('origin');
 if(origin!=='https://wonplace.tidelinestrats.com')return json(403,{ok:false,error:'origin_not_allowed'});
 const cors={'access-control-allow-origin':origin,'vary':'Origin'};
 const respond=(status,body)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json','cache-control':'no-store'}});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'POST','access-control-allow-headers':'content-type'}});
 if(request.method!=='POST')return respond(405,{ok:false,error:'method_not_allowed'});
 if(request.headers.get('sec-gpc')==='1'||request.headers.get('dnt')==='1')return respond(202,{ok:true,saved:false});
 try{if(!(await env.CONTACT_RATE_LIMIT.limit({key:'wonplace-analytics:'+(request.headers.get('cf-connecting-ip')||'unknown')})).success)return respond(429,{ok:false,error:'rate_limited'});}catch{return respond(503,{ok:false,error:'analytics_unavailable'});}
 const input=await parseBody(request);
 if(!input||!uuid.test(input.id)||!uuid.test(input.session)||!['page_view','preview_open','product_interaction','spring_open'].includes(input.kind)||!['home','preview','product','spring'].includes(input.page)||!['phone','tablet','desktop'].includes(input.device))return respond(400,{ok:false,error:'invalid_event'});
 let host='';try{host=new URL(input.referrer).hostname.slice(0,200);}catch{}
 try{const saved=await env.CONTACT_DB.prepare('INSERT OR IGNORE INTO wonplace_site_events (id,created_at,kind,page,session_id,referrer_host,device) VALUES (?,?,?,?,?,?,?)').bind(input.id,new Date().toISOString(),input.kind,input.page,input.session,host,input.device).run();return respond(202,{ok:true,saved:saved.meta?.changes===1});}catch{return respond(503,{ok:false,error:'analytics_unavailable'});}
}
