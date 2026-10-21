// Each saved audit has a private virtual directory in D1. Email alone never grants access.
const tidy = (value,max) => String(value || '').trim().slice(0,max);
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function savedAudit(env,id) {
  return env.CONTACT_DB.prepare('SELECT * FROM loki_audit_saves WHERE audit_id = ?').bind(id).first();
}
export function memoryStatements(db,row,save) {
  const directory=save.workspace_path;
  const files={
    'profile.json':{email:save.email,business:row.business_hint,source:'Owner-provided; email not verified'},
    'owner-facts.json':{business:row.business_hint,answers:JSON.parse(row.turns_json || '[]').map(turn=>turn.answer),source:'Owner statements, not independently verified'},
    'conversation.json':{business:row.business_hint,turns:JSON.parse(row.turns_json || '[]'),message:JSON.parse(row.last_message_json || '{}')},
    'working-plan.json':row.result_json ? JSON.parse(row.result_json) : null
  };
  return Object.entries(files).map(([name,data])=>db.prepare('INSERT INTO loki_memory_files (audit_id,path,content,updated_at) VALUES (?,?,?,?) ON CONFLICT(audit_id,path) DO UPDATE SET content=excluded.content,updated_at=excluded.updated_at').bind(row.id,directory+name,JSON.stringify(data),new Date().toISOString()));
}
export async function saveAudit(env,row,input) {
  const email=tidy(input.email,180).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {status:400,error:'valid_email_required'};
  if(input.consent !== true) return {status:400,error:'save_consent_required'};
  if(!env.CRM_DB) return {status:503,error:'crm_unavailable'};
  const existing=await savedAudit(env,row.id);
  if(existing && existing.email !== email) return {status:409,error:'audit_already_saved'};
  const key=(await digest(email)).slice(0,32), now=Date.now();
  const match=await env.CRM_DB.prepare("SELECT id,data_json FROM documents WHERE collection='contacts' AND lower(json_extract(data_json,'$.email')) = ? LIMIT 1").bind(email).first();
  const contact=match ? JSON.parse(match.data_json) : null;
  const contactId=match?.id || 'loki-contact-'+key;
  const accountId=contact?.oppId || 'loki-account-'+key;
  const source={source:'Ask Loki email save',sourceNote:'Visitor requested saved Loki memory. Email unverified; no outreach consent.',lokiWorkspace:'customers/'+contactId+'/loki/'};
  const insert=(collection,id,data)=>env.CRM_DB.prepare('INSERT OR IGNORE INTO documents (collection,id,data_json,updated_at) VALUES (?,?,?,?)').bind(collection,id,JSON.stringify(data),now);
  const writes=[];
  if(!match){
    writes.push(insert('opps',accountId,{name:row.business_hint.slice(0,120),stage:0,source:source.source,sourceNote:source.sourceNote,createdTs:now,stageTs:now,notes:'Business description supplied in Ask Loki. Contact name not provided.'}));
    writes.push(insert('contacts',contactId,{oppId:accountId,name:email,email,role:'Other',primary:true,title:'',phone:'',notes:source.sourceNote+' Business: '+row.business_hint,createdTs:now,...source}));
  }
  writes.push(insert('tideline_links','audit:'+row.id,{kind:'audit_save',oppId:accountId,contactId,submittedAt:row.created_at,importedAt:now}));
  writes.push(insert('notes','loki-audit-'+row.id,{oppId:accountId,contactId,title:'Saved Ask Loki conversation',type:'Discovery',oppName:row.business_hint.slice(0,120),date:new Date(now).toISOString().slice(0,10),text:'Saved Ask Loki conversation. '+source.sourceNote+'\nBusiness: '+row.business_hint+'\nPrivate workspace: '+source.lokiWorkspace+row.id+'/',createdTs:now,updatedTs:now,by:'Loki',lokiAuditId:row.id,lokiWorkspace:source.lokiWorkspace+row.id+'/'}));
  await env.CRM_DB.batch(writes);
  const save={audit_id:row.id,email,workspace_path:source.lokiWorkspace+row.id+'/',crm_contact_id:contactId,crm_account_id:accountId,saved_at:new Date().toISOString()};
  const db=env.CONTACT_DB;
  await db.prepare('INSERT OR IGNORE INTO loki_audit_saves (audit_id,email,workspace_path,crm_contact_id,crm_account_id,saved_at) VALUES (?,?,?,?,?,?)').bind(row.id,email,save.workspace_path,contactId,accountId,save.saved_at).run();
  const stored=await savedAudit(env,row.id);
  if(stored.email !== email) return {status:409,error:'audit_already_saved'};
  await db.batch(memoryStatements(db,row,stored));
  return {status:200,saved:true,email,workspacePath:stored.workspace_path};
}
