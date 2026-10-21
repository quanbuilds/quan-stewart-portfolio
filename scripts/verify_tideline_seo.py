"""Verify the exact deployed search surface, with bounded propagation retries."""
import hashlib,json,os,pathlib,subprocess,time,urllib.parse
from check_tideline_seo import inspect,Page,SITE,ORIGIN

def get(path):
 return subprocess.check_output(['curl','--compressed','-L','-f','-sS','--max-time','30',ORIGIN+path])
def verify():
 urls=inspect();commit=os.environ['AGENT_RELEASE_COMMIT']
 assert json.loads(get('/__release.json'))['commit']==commit
 assert Page(get('/').decode()).meta.get('msvalidate.01') == Page((SITE/'index.html').read_text()).meta['msvalidate.01']
 files=['index.html','site.js','site.css','analytics.js','sitemap.xml','robots.txt','llms.txt','loki/index.html']
 files += [urllib.parse.urlsplit(url).path.lstrip('/')+'index.html' for url in urls if urllib.parse.urlsplit(url).path not in ['/','/loki/']]
 for asset in files:
  path='/' if asset=='index.html' else '/'+asset.removesuffix('index.html') if asset.endswith('index.html') else '/'+asset
  actual=get(path);expected=(SITE/asset).read_bytes()
  assert hashlib.sha256(actual).digest()==hashlib.sha256(expected).digest(),asset
 for url in urls:
  path=urllib.parse.urlsplit(url).path;page=Page(get(path).decode());assert page.meta['og:url']==url
  headers=subprocess.check_output(['curl','-sSI','--max-time','30',url]).decode()
  assert 'noindex' not in headers.lower(),url
  for script in page.scripts:
   if script['type']=='application/ld+json':
    import base64
    digest='sha256-'+base64.b64encode(hashlib.sha256(script['content'].encode()).digest()).decode()
    assert digest in headers,url
  assert get(urllib.parse.urlsplit(page.meta['og:image']).path)
 status=subprocess.check_output(['curl','-sS','-o','/dev/null','-w','%{http_code}',ORIGIN+'/seo-acceptance-nonexistent-page-be392a17f505/']).decode()
 assert status=='404',status
 cli=['npx','--yes','--package=wrangler@4.148.0','wrangler']
 active=max(json.loads(subprocess.check_output(cli+['deployments','list','--name','go','--profile','default','--json'],env={**os.environ,'CLOUDFLARE_ACCOUNT_ID':'58008ae4816f34f96786f0f52834dce5'})),key=lambda row:row['created_on'])
 version=next(v['version_id'] for v in active['versions'] if v['percentage']==100)
 assert version in (pathlib.Path.home()/'.agent-workspaces/coordinator/logs'/f"{os.environ['AGENT_RELEASE_TASK']}.log").read_text()
 receipt={'commit':commit,'deploymentId':active['id'],'accepted':True,'evidence':{'publicPages':urls,'exactLiveAssets':files,'metadata':'unique canonical, social cards and titles verified','structuredData':'valid JSON-LD, visible FAQ agreement and exact CSP hashes','crawlability':'public sitemap and waitlist allowed; API excluded; missing page returns 404','scope':'no customer conversations, phone numbers, tokens or private memory in search content'}}
 pathlib.Path(os.environ['AGENT_RELEASE_RECEIPT']).write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
for attempt in range(4):
 try:
  verify();break
 except (AssertionError,subprocess.CalledProcessError) as error:
  if attempt==3:raise
  print(f'Propagation recheck {attempt+1}: {error}',flush=True);time.sleep(10)
