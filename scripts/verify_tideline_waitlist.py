"""Verify exact released assets and synthetic waitlist persistence without sending texts."""
import hashlib,json,os,pathlib,subprocess
root=pathlib.Path.cwd(); origin='https://tidelinestrats.com'
env={**os.environ,'CLOUDFLARE_ACCOUNT_ID':'58008ae4816f34f96786f0f52834dce5'}
cli=['npx','--yes','--package=wrangler@4.148.0','wrangler']
def command(args): return subprocess.check_output(args,env=env)
def query(sql):
 return json.loads(command(cli+['d1','execute','tideline-contact','--remote','--profile','default','--config',str(root/'cloudflare/go/wrangler.jsonc'),'--command',sql,'--json']))[0]['results']
def post(phone):
 return json.loads(command(['curl','-fsS',origin+'/api/loki/waitlist','-H','Origin: '+origin,'-H','Content-Type: application/json','--data-binary',json.dumps({'phone':phone,'consent':True})]))
commit=os.environ['AGENT_RELEASE_COMMIT'];assert command(['git','rev-parse','HEAD']).decode().strip()==commit
evidence={}
for asset in ['site.css','loki/index.html','loki/waitlist.js','loki/waitlist.css','loki/sw.js']:
 actual=command(['curl','--compressed','-fsS',origin+'/'+asset]);assert hashlib.sha256(actual).digest()==hashlib.sha256((root/'signallabs'/asset).read_bytes()).digest(),asset
 evidence[asset]='matches committed asset'
# Reserve a fictional NANP 555-01xx number only when it has no existing record.
phone=None
for suffix in range(100,200):
 candidate='+1202555'+str(suffix).zfill(4)
 if not query(f"SELECT phone FROM loki_waitlist WHERE phone='{candidate}'"):
  phone=candidate;break
assert phone
try:
 assert post(phone)['ok'];assert post(phone[2:])['ok']
 rows=query(f"SELECT phone,consent_version FROM loki_waitlist WHERE phone='{phone}'")
 assert len(rows)==1 and rows[0]['consent_version']=='launch-notification-v1'
 evidence['waitlist']='live signup persisted, normalized duplicate yields one row, consent recorded; synthetic entry removed'
finally:
 query(f"DELETE FROM loki_waitlist WHERE phone='{phone}'")
active=max(json.loads(command(cli+['deployments','list','--name','go','--profile','default','--json'])),key=lambda row:row['created_on'])
version=next(v['version_id'] for v in active['versions'] if v['percentage']==100)
assert version in (pathlib.Path.home()/'.agent-workspaces/coordinator/logs'/f"{os.environ['AGENT_RELEASE_TASK']}.log").read_text()
receipt={'commit':commit,'deploymentId':active['id'],'accepted':True,'evidence':evidence}
pathlib.Path(os.environ['AGENT_RELEASE_RECEIPT']).write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
