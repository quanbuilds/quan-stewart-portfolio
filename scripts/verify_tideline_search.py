import json,os,re,urllib.request,pathlib
base='https://tidelinestrats.com'
def get(path):
 with urllib.request.urlopen(base+path,timeout=30) as r:return r.read().decode()
marker=json.loads(get('/__release.json'));assert marker['commit']==os.environ['AGENT_RELEASE_COMMIT']
assert 'https://tidelinestrats.com/' in get('/sitemap.xml')
assert 'Sitemap: https://tidelinestrats.com/sitemap.xml' in get('/robots.txt')
assert 'application/ld+json' in get('/')
req=urllib.request.Request(base+'/api/wonplace/events',data=json.dumps({'id':'e987f9db-2210-4afc-a6c9-71197b3f1131','session':'e987f9db-2210-4afc-a6c9-71197b3f1132','kind':'page_view','page':'home','device':'desktop'}).encode(),headers={'Content-Type':'application/json','Origin':'https://wonplace.tidelinestrats.com','DNT':'1'})
with urllib.request.urlopen(req,timeout=30) as r:assert r.status==202 and json.load(r)['saved']==False
ids=re.findall(r'Version ID:\s*([a-f0-9-]{36})',pathlib.Path('.tideline-release.log').read_text());assert ids
pathlib.Path(os.environ['AGENT_RELEASE_RECEIPT']).write_text(json.dumps({'commit':marker['commit'],'deploymentId':ids[-1],'accepted':True,'evidence':{'origin':base,'sitemap':True,'robots':True,'schema':True,'wonplaceCollectorPrivacyOptout':True}}))
