"""Coordinator acceptance: exact assets, deployed version, and a disposable live audit."""
import hashlib,json,os,pathlib,subprocess
commit=os.environ['AGENT_RELEASE_COMMIT']
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==commit
origin='https://tidelinestrats.com'
evidence={}
for asset in ('index.html','site.css','loki-audit.js','loki-plan-pdf.js','loki-pdf-brand.js','loki-text.js','vendor/jspdf-4.2.1.umd.min.js','assets/tools/trello.ico','assets/tools/calendly.ico','assets/tools/zapier.ico'):
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
    start=post('start',{'business':'I run a residential cleaning business with seven cleaners and a part-time office manager. Quotes slip through, and I spend evenings checking the next day’s schedule.'})
    session={k:start[k] for k in ('id','token')}
    assert start['message']['question']
    for answer in [
        'We get roughly 15-20 inquiries a week by text, calls and Facebook messages. The office manager works 9-1 and uses a notebook. I handle unusual quotes. There is no shared list.',
        'Accepted jobs go in Google Calendar. Customers also text cleaners directly. We have double-booked twice this month because the calendar was not updated. I spend about 45 minutes checking each evening.',
        'We already post tomorrow’s jobs in a group text and chase thumbs-up replies. Changes need to account for travel, cleaner skills and whether a two-person crew is needed.',
        'We tried a scheduling app and the team stopped using it. I prefer our existing tools and one change first. Budget is $75 a month if needed. What should we actually do on Monday after the office manager leaves at 1?']:
        message=post('turn',{**session,'answer':answer})['message']
    assert len(message['reply'])<=260 and not message['question']
    assert message['ready'] and len(message['opportunities'])==3 and message['pilot']
    assert message['synthesis']['headline'] and message['synthesis']['connection'] and message['synthesis']['firstMove']
    for item in message['opportunities']:
        assert item['takeaway'] and item['owner'] and item['timing']
        assert len(item['steps'])==3 and item['doneWhen'] and item['fallback']
        assert item['aiHelp'] and item['aiPrompt'] and item['humanCheck']
    evidence['synthesis_and_execution']='diagnosis, causal explanation, ranked actions, owners, steps, acceptance checks, recovery actions'
    follow=post('turn',{**session,'answer':'We already use group texts, and Calendly will not know crew travel or job skills. I do not want more daily chasing put back on me. What is the one easiest change using our existing tools, and who handles requests after 1?'})['message']
    assert follow['reply']
    import re
    for reply in (start['message'],message,follow):
        assert not re.search(r'[.!?][\s,\"\']*(arrival|handoff|tools|confirmation)$',reply.get('reply','')+' '+reply.get('question',''),re.I)
    state=post('state',session)
    assert state['report']['pilot'] and len(state['turns'])==5
    pdf_check = subprocess.check_output(['node','-e', '''const {jsPDF}=require('./signallabs/vendor/jspdf-4.2.1.umd.min.js');globalThis.LokiPDFBrand=require('./signallabs/loki-pdf-brand.js');const {create}=require('./signallabs/loki-plan-pdf.js');let raw='';process.stdin.on('data',chunk=>raw+=chunk);process.stdin.on('end',()=>{const pdf=create(jsPDF,JSON.parse(raw),'Residential cleaning business');const bytes=Buffer.from(pdf.output('arraybuffer'));if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('invalid PDF');console.log(JSON.stringify({pages:pdf.getNumberOfPages(),bytes:bytes.length}));});'''],input=json.dumps(state['report']).encode())
    evidence['pdf']=json.loads(pdf_check)
    evidence['consultation_sample']={'introduction':message['reply'],'diagnosis':message['synthesis'],'first_action':message['opportunities'][0]['firstStep'],'ai_help':message['opportunities'][0]['aiHelp'],'objection_reply':follow['reply']}
    evidence['live_audit']='started, completed, accepted objection, and restored report'
finally:
    if session: post('delete',session)
receipt={'commit':commit,'deploymentId':active['id'],'accepted':True,'evidence':evidence}
pathlib.Path(os.environ['AGENT_RELEASE_RECEIPT']).write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt))
