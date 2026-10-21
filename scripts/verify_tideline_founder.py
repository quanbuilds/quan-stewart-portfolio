"""Release acceptance: exact assets, email memory, and the corrected founder scenario.

The regression row is synthetic and deliberately contains an old, bad draft.
Only this newly created row is seeded and deleted; no visitor record is changed.
"""
import json, os, pathlib, runpy, subprocess, tempfile, unicodedata
receipt_path=os.environ['AGENT_RELEASE_RECEIPT']
with tempfile.TemporaryDirectory(prefix='loki-founder-acceptance-') as scratch:
    os.environ['AGENT_RELEASE_RECEIPT']=str(pathlib.Path(scratch)/'email-receipt.json')
    checks=runpy.run_path('scripts/verify_tideline_email_memory.py')
    receipt=json.loads(pathlib.Path(os.environ['AGENT_RELEASE_RECEIPT']).read_text())
    os.environ['AGENT_RELEASE_RECEIPT']=receipt_path
    fixture=json.loads(pathlib.Path('cloudflare/go/test/fixtures/founder-hvac.json').read_text())
    origin=checks['origin']
    def post(path,body):
        raw=subprocess.check_output(['curl','-sS','--max-time','300',origin+'/api/audit/'+path,'-H','Origin: '+origin,'-H','Content-Type: application/json','--data-binary',json.dumps(body),'-w','\n%{http_code}'])
        payload,status=raw.rsplit(b'\n',1)
        assert int(status)==200,(path,status,payload[:300])
        return json.loads(payload)
    def sql(value): return "'"+value.replace("'","''")+"'"
    def text(message): return unicodedata.normalize('NFKC',json.dumps(message,ensure_ascii=False)).lower()
    session=None
    try:
        start=post('start',{'business':fixture['hint'][:240]})
        session={k:start[k] for k in ['id','token']}
        turns=[{'answer':answer,'reply':'Create an Outlook task for each estimate.','question':''} for answer in fixture['answers'][:5]]
        bad={'pilot':'Create eighteen Outlook reminders and review Tuesday and Thursday.'}
        checks['query']('tideline-contact','UPDATE loki_audits SET turns_json='+sql(json.dumps(turns))+', result_json='+sql(json.dumps(bad))+', revision=revision+1 WHERE id='+sql(session['id']))
        report=post('turn',{**session,'answer':fixture['answers'][5]})['message']
        assert report['ready'] and 1<=len(report['opportunities'])<=3
        assert report['tools']==[], 'A workflow constraint is not permission to promote software'
        content=text(report)
        for term in ['melissa','20','tuesday','friday','next','baseline']:
            assert term in content,('report missing owner requirement',term)
        assert 'hi' in content or 'hello' in content, 'The requested opening must contain actual words to say'
        follow=post('turn',{**session,'answer':fixture['answers'][6]})['message']
        assert not follow['ready'] and not follow['opportunities'], 'A mention of the revised plan must stay in chat'
        reply=text(follow['reply'])
        for term in ['melissa','20','tuesday','friday','note','next']:
            assert term in reply,('follow-up missing usable detail',term)
        assert ('hi' in reply or 'hello' in reply) and ('date' in reply or 'due' in reply)
        restored=post('state',session)
        assert restored['report']['pilot']==report['pilot'], 'Ordinary follow-up must preserve the current PDF plan'
        receipt['evidence']['founder_regression']={'scenario':'Synthetic $1.8M HVAC founder, 18 estimates, constrained staff capacity and rejected tools','report':report,'followup':follow,'checks':'explicit revision; no promoted tools; actual opening; staff and review-day preservation; dated next action; ordinary follow-up does not replace report'}
    finally:
        if session: post('delete',session)
    pathlib.Path(receipt_path).write_text(json.dumps(receipt,indent=2))
    print(json.dumps({'commit':receipt['commit'],'deploymentId':receipt['deploymentId'],'accepted':True,'founder_regression':'passed'}))
