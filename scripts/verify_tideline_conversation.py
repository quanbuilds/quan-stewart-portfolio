"""Coordinator acceptance: exact assets, deployed version, and a disposable live audit."""
import hashlib,json,os,pathlib,subprocess
commit=os.environ['AGENT_RELEASE_COMMIT']
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==commit
origin='https://tidelinestrats.com'
evidence={}
for asset in ('index.html','site.css','loki-audit.js','assets/tools/trello.ico','assets/tools/calendly.ico','assets/tools/zapier.ico'):
    url=origin+('/' if asset=='index.html' else '/'+asset)
    actual=subprocess.check_output(['curl','--compressed','-fsS','--max-time','30',url])
    assert hashlib.sha256(actual).digest()==hashlib.sha256(pathlib.Path('signallabs',asset).read_bytes()).digest(),asset
    evidence[asset]='matches committed asset'
cli=['npx','--yes','--package=wrangler@4.148.0','wrangler']
items=json.loads(subprocess.check_output(cli+['deployments','list','--name','go','--profile','tideline','--json'],text=True))
active=max(items,key=lambda x:x['created_on'])
versions=[v['version_id'] for v in active['versions'] if v['percentage']==100]
assert len(versions)==1
log=(pathlib.Path.home()/'.agent-workspaces/coordinator/logs'/f"{os.environ['AGENT_RELEASE_TASK']}.log").read_text()
assert versions[0] in log

def post(path,body):
    data=json.loads(subprocess.check_output(['curl','--fail-with-body','--silent','--show-error','--max-time','90',origin+'/api/audit/'+path,'-H','Origin: '+origin,'-H','Content-Type: application/json','--data-binary','@-'],input=json.dumps(body).encode()))
    assert data['ok']
    return data
session=None
try:
    start=post('start',{'business':'Fictional QA studio: front desk tracks daily tasks on paper. Test only.'})
    session={k:start[k] for k in ('id','token')}
    assert start['message']['question']
    for answer in ['One desk lead handles incoming phone inquiries and paper task lists.', 'The next shift sometimes misses the handwritten follow-up. We use a shared calendar too.', 'We do not know weekly volumes. Two desk staff share the task list.', 'Our goal is fewer missed handoffs. Please finish a practical two-week plan.']:
        message=post('turn',{**session,'answer':answer})['message']
    assert message['ready'] and len(message['opportunities'])==3 and message['pilot']
    follow=post('turn',{**session,'answer':'We do not want another app. Can we keep the paper list? Please explain without repeating the whole audit.'})['message']
    assert follow['reply']
    state=post('state',session)
    assert state['report']['pilot'] and len(state['turns'])==5
    evidence['live_audit']='started, completed, accepted objection, and restored report'
finally:
    if session: post('delete',session)
receipt={'commit':commit,'deploymentId':active['id'],'accepted':True,'evidence':evidence}
pathlib.Path(os.environ['AGENT_RELEASE_RECEIPT']).write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt))
