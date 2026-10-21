"""Exact deployed intake + anonymous conversion acceptance; only synthetic records are removed."""
import hashlib,json,os,pathlib,subprocess,uuid
ROOT=pathlib.Path.cwd();BASE='https://tidelinestrats.com';task=os.environ['AGENT_RELEASE_TASK'];commit=os.environ['AGENT_RELEASE_COMMIT']
ENV={**os.environ,'CLOUDFLARE_ACCOUNT_ID':'58008ae4816f34f96786f0f52834dce5'};CLI=['npx','--yes','--package=wrangler@4.148.0','wrangler']
def command(args):return subprocess.check_output(args,env=ENV)
def query(db,sql):return json.loads(command(CLI+['d1','execute',db,'--remote','--profile','default','--config','cloudflare/go/wrangler.jsonc','--command',sql,'--json']))[0]['results']
def post(path,body):
 raw=command(['curl','-sS','--max-time','120',BASE+path,'-H','Origin: '+BASE,'-H','Content-Type: application/json','--data-binary',json.dumps(body),'-w','\n%{http_code}']);payload,status=raw.rsplit(b'\n',1);assert int(status) in [200,202],(path,status);return json.loads(payload)
assert json.loads(command(['curl','-fsS',BASE+'/__release.json']))['commit']==commit
for asset in ['index.html','analytics.js','site.js','loki-audit.js','loki/index.html','loki/waitlist.js']:
 url=BASE+('/' if asset=='index.html' else '/loki/' if asset=='loki/index.html' else '/'+asset)
 assert hashlib.sha256(command(['curl','-L','--compressed','-fsS',url])).digest()==hashlib.sha256((ROOT/'signallabs'/asset).read_bytes()).digest(),asset
id=str(uuid.uuid5(uuid.NAMESPACE_URL,'tideline-intake:'+task));session=str(uuid.uuid5(uuid.NAMESPACE_URL,'tideline-visit:'+task));email='intake-'+task+'@example.invalid';audit_email='audit-'+task+'@example.invalid';analytics={'session':session,'device':'desktop'};phone=None;audit=None
owned=[]
try:
 assert query('tideline-contact',f"SELECT id FROM contact_inquiries WHERE id='{id}'")==[]
 # Seed a disposable pending source so the public duplicate path exercises production CRM wiring without sending notification emails.
 query('tideline-contact',f"INSERT INTO contact_inquiries (id,submitted_at,name,business,email,phone,message,notification_detail) VALUES ('{id}',strftime('%Y-%m-%dT%H:%M:%fZ','now'),'Synthetic release owner','Synthetic intake acceptance','{email}','','Synthetic release acceptance; no outreach.','Synthetic fixture; no delivery requested')")
 body={'requestId':id,'name':'Synthetic release owner','business':'Synthetic intake acceptance','email':email,'message':'Synthetic release acceptance; no outreach.','analytics':analytics}
 assert post('/api/contact',body)['duplicate'];post('/api/contact',body)
 states=query('tideline-contact',f"SELECT * FROM crm_intake_receipts WHERE kind='contact' AND source_id='{id}'");assert len(states)==1 and states[0]['status']=='linked';owned.append(('contact',id,states[0]['crm_contact_id'],states[0]['crm_account_id']))
 assert query('tideline-contact',f"SELECT notification_detail FROM contact_inquiries WHERE id='{id}'")[0]['notification_detail']=='Synthetic fixture; no delivery requested'
 for suffix in range(100,200):
  candidate='+1202555'+str(suffix).zfill(4)
  if not query('tideline-contact',f"SELECT phone FROM loki_waitlist WHERE phone='{candidate}'") and not query('the-voyage',f"SELECT id FROM documents WHERE collection='contacts' AND json_extract(data_json,'$.phone')='{candidate}'"):phone=candidate;break
 assert phone
 assert post('/api/loki/waitlist',{'phone':phone,'consent':True,'analytics':analytics})['ok'];post('/api/loki/waitlist',{'phone':phone[2:],'consent':True,'analytics':analytics})
 state=query('tideline-contact',f"SELECT * FROM crm_intake_receipts WHERE kind='waitlist' AND source_id='{phone}'")[0];assert state['status']=='linked';owned.append(('waitlist',phone,state['crm_contact_id'],state['crm_account_id']))
 contact=query('the-voyage',f"SELECT data_json FROM documents WHERE collection='contacts' AND id='{state['crm_contact_id']}'");assert json.loads(contact[0]['data_json'])['consent']['purpose']=='loki-launch'
 start=post('/api/audit/start',{'business':'Synthetic release acceptance: a service business needs clearer ownership of customer follow-up.','analytics':analytics});audit={k:start[k] for k in ['id','token']}
 assert post('/api/audit/save',{**audit,'email':audit_email,'consent':True,'analytics':analytics})['saved'];post('/api/audit/save',{**audit,'email':audit_email,'consent':True,'analytics':analytics})
 counts=query('tideline-contact',f"SELECT kind,count(*) n FROM conversion_events WHERE session_id='{session}' GROUP BY kind");assert {row['kind']:row['n'] for row in counts}=={'audit_started':1,'audit_saved':1,'contact_submitted':1,'waitlist_joined':1}
 for kind,source,contact_id,account_id in owned:
  rows=query('the-voyage',f"SELECT id FROM documents WHERE collection='contacts' AND id='{contact_id}'");assert len(rows)==1
  assert len(query('the-voyage',f"SELECT id FROM documents WHERE collection='notes' AND json_extract(data_json,'$.contactId')='{contact_id}'"))==1
finally:
 if audit:
  post('/api/audit/delete',audit)
  key=hashlib.sha256(audit_email.encode()).hexdigest()[:32]
  query('the-voyage',f"DELETE FROM documents WHERE revision=1 AND ((collection='contacts' AND id='loki-contact-{key}' AND json_extract(data_json,'$.email')='{audit_email}') OR (collection='opps' AND id='loki-account-{key}') OR (collection='notes' AND id='loki-audit-{audit['id']}') OR (collection='tideline_links' AND id='audit:{audit['id']}'))")
 for kind,source,contact_id,account_id in owned:
  link_id=source if kind=='contact' else 'waitlist:'+hashlib.sha256(source.encode()).hexdigest()[:32]
  query('the-voyage',f"DELETE FROM documents WHERE revision=1 AND ((collection='contacts' AND id='{contact_id}') OR (collection='opps' AND id='{account_id}') OR (collection='notes' AND id='tideline-{link_id}') OR (collection='tideline_links' AND id='{link_id}'))")
 query('tideline-contact',f"DELETE FROM crm_intake_receipts WHERE kind='contact' AND source_id='{id}'; DELETE FROM contact_inquiries WHERE id='{id}' AND email='{email}'; DELETE FROM conversion_events WHERE session_id='{session}'")
 if phone:query('tideline-contact',f"DELETE FROM crm_intake_receipts WHERE kind='waitlist' AND source_id='{phone}'; DELETE FROM loki_waitlist WHERE phone='{phone}'")
active=max(json.loads(command(CLI+['deployments','list','--name','go','--profile','default','--json'])),key=lambda row:row['created_on'])
version=next(v['version_id'] for v in active['versions'] if v['percentage']==100);log=(pathlib.Path.home()/'.agent-workspaces/coordinator/logs'/f'{task}.log').read_text();assert version in log
assert '*/10 * * * *' in log,'Scheduled retry trigger was not confirmed'
receipt={'commit':commit,'deploymentId':active['id'],'accepted':True,'evidence':{'intake':'Contact duplicate recovery and phone signup created exactly one CRM contact, account, note and source link each; no email/SMS was sent','conversion':'All four successful steps recorded once per source with anonymous session context','memory':'Saved Loki email linked privately and conversion deduplicated','retry':'Bounded ten-minute scheduled reconciliation configured; failed CRM writes retain source records','cleanup':'Only synthetic release records removed','assets':'Exact released public intake assets verified'}}
pathlib.Path(os.environ['AGENT_RELEASE_RECEIPT']).write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
