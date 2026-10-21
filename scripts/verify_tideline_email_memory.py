"""Exact deployed assets, authenticated email-save flow, CRM and cloud-memory readback."""
import hashlib,json,os,pathlib,subprocess
root=pathlib.Path.cwd()
origin='https://tidelinestrats.com'
cli=['npx','--yes','--package=wrangler@4.148.0','wrangler']
profile=os.environ.get('TIDELINE_WRANGLER_PROFILE','default')
env={**os.environ,'CLOUDFLARE_ACCOUNT_ID':'58008ae4816f34f96786f0f52834dce5'}
def command(args): return subprocess.check_output(args,env=env)
def query(database,sql):
    return json.loads(command(cli+['d1','execute',database,'--remote','--profile',profile,'--config',str(root/'cloudflare/go/wrangler.jsonc'),'--command',sql,'--json']))[0]['results']
def post(path,body,expected=200):
    raw=command(['curl','-sS','--max-time','90',origin+'/api/audit/'+path,'-H','Origin: '+origin,'-H','Content-Type: application/json','--data-binary',json.dumps(body),'-w','\n%{http_code}'])
    payload,status=raw.rsplit(b'\n',1)
    assert int(status)==expected,(path,status,payload)
    return json.loads(payload)
commit=os.environ['AGENT_RELEASE_COMMIT']
assert command(['git','rev-parse','HEAD']).decode().strip()==commit
evidence={}
for asset in ['index.html','site.js','loki-audit.js','site.css']:
    actual=command(['curl','--compressed','-fsS',origin+('/' if asset=='index.html' else '/'+asset)])
    assert hashlib.sha256(actual).digest()==hashlib.sha256((root/'signallabs'/asset).read_bytes()).digest()
    evidence[asset]='matches committed asset'
active=max(json.loads(command(cli+['deployments','list','--name','go','--profile',profile,'--json'])),key=lambda row:row['created_on'])
version=next(v['version_id'] for v in active['versions'] if v['percentage']==100)
assert version in (pathlib.Path.home()/'.agent-workspaces/coordinator/logs'/f"{os.environ['AGENT_RELEASE_TASK']}.log").read_text()
email='loki-memory-'+os.environ['AGENT_RELEASE_TASK']+'@example.invalid'
key=hashlib.sha256(email.encode()).hexdigest()[:32]
contact='loki-contact-'+key
account='loki-account-'+key
session=None
try:
    data=post('start',{'business':'Hypothetical email-save acceptance test: a property management team wants fewer missed inquiries.'})
    session={k:data[k] for k in ['id','token']}
    assert post('state',session)['saved'] is False
    body={**session,'email':email,'consent':True}
    first=post('save',body)
    assert post('save',body)['workspacePath']==first['workspacePath']
    state=post('state',session)
    assert state['saved'] and state['email']==email
    assert state['workspacePath'].startswith('customers/'+contact+'/loki/')
    contacts=query('the-voyage',f"SELECT id,data_json FROM documents WHERE collection='contacts' AND id='{contact}'")
    assert len(contacts)==1 and json.loads(contacts[0]['data_json'])['email']==email
    notes=query('the-voyage',f"SELECT id FROM documents WHERE collection='notes' AND id='loki-audit-{session['id']}'")
    assert len(notes)==1
    files=query('tideline-contact',f"SELECT path FROM loki_memory_files WHERE audit_id='{session['id']}'")
    assert len(files)==4 and all(f['path'].startswith(state['workspacePath']) for f in files)
    post('turn',{**session,'answer':'For this test, assume inquiries arrive in one shared email inbox, but no one owns afternoon follow-up.'})
    facts=query('tideline-contact',f"SELECT content FROM loki_memory_files WHERE audit_id='{session['id']}' AND path LIKE '%owner-facts.json'")
    assert 'shared email inbox' in json.loads(facts[0]['content'])['answers'][0]
    post('state',{'id':session['id'],'token':'0'*64,'email':email},404)
    evidence['email_save']='anonymous state, explicit save, idempotent CRM contact and note, authenticated restoration, four scoped memory files, live owner-fact update, wrong-token denial'
finally:
    if session:
        post('delete',session)
        assert query('tideline-contact',f"SELECT audit_id FROM loki_memory_files WHERE audit_id='{session['id']}'")==[]
        assert query('tideline-contact',f"SELECT audit_id FROM loki_audit_saves WHERE audit_id='{session['id']}'")==[]
        # Remove only synthetic acceptance records, leaving real contacts untouched.
        query('the-voyage',f"DELETE FROM documents WHERE (collection='contacts' AND id='{contact}' AND json_extract(data_json,'$.email')='{email}' AND revision=1) OR (collection='opps' AND id='{account}' AND revision=1) OR (collection='notes' AND id='loki-audit-{session['id']}' AND revision=1)")
receipt={'commit':commit,'deploymentId':active['id'],'accepted':True,'evidence':evidence}
pathlib.Path(os.environ['AGENT_RELEASE_RECEIPT']).write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt))
