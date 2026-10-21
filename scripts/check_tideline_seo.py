"""Static checks for crawlability, canonical metadata, visible schema and internal links."""
import base64,hashlib,json,pathlib,re,urllib.parse,urllib.robotparser,xml.etree.ElementTree as ET
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1];SITE=ROOT/'signallabs';ORIGIN='https://tidelinestrats.com'
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=True);self.meta={};self.links=[];self.h1=0;self.scripts=[];self.script=None;self.title='';self.in_title=False;self.text=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='meta':self.meta[a.get('name',a.get('property'))]=a.get('content','')
  if tag in ['a','link']:self.links.append((tag,a))
  if tag=='h1':self.h1+=1
  if tag=='title':self.in_title=True
  if tag=='script':self.script={'type':a.get('type'),'src':a.get('src'),'content':''}
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
  if tag=='script' and self.script:self.scripts.append(self.script);self.script=None
 def handle_data(self,data):
  if self.script is not None:self.script['content']+=data
  else:self.text.append(data)
  if self.in_title:self.title+=data

def pages():
 return [row.text for row in ET.fromstring((SITE/'sitemap.xml').read_text()).findall('{*}url/{*}loc')]
def inspect():
 urls=pages();assert len(urls)==7 and len(set(urls))==7
 robots=urllib.robotparser.RobotFileParser();robots.parse((SITE/'robots.txt').read_text().splitlines())
 headers=(SITE/'_headers').read_text();titles=set();descriptions=set();inbound=set();count=0
 for url in urls:
  assert url.startswith(ORIGIN+'/') and '?' not in url and '#' not in url
  path=urllib.parse.urlsplit(url).path;file=SITE/path.lstrip('/')/'index.html';text=file.read_text();page=Page(text)
  assert robots.can_fetch('Googlebot',url),url
  assert page.h1==1,(url,page.h1)
  assert len(re.findall(r'<title>',text))==1 and page.title not in titles; titles.add(page.title)
  assert page.meta.get('description') and page.meta['description'] not in descriptions;descriptions.add(page.meta['description'])
  assert len([k for k in re.findall(r'name="description"',text)])==1
  assert [(tag,a) for tag,a in page.links if a.get('rel')=='canonical']==[('link',{'rel':'canonical','href':url})]
  assert page.meta.get('og:url')==url and page.meta.get('og:title')==page.title
  for name in ['og:description','og:image','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image']:assert page.meta.get(name),(url,name)
  assert 'noindex' not in page.meta.get('robots','').lower()
  for script in page.scripts:
   if script['src']:continue
   assert script['type']=='application/ld+json','Unexpected inline executable script'
   digest='sha256-'+base64.b64encode(hashlib.sha256(script['content'].encode()).digest()).decode();assert digest in headers,url
   graph=json.loads(script['content'])['@graph'];count+=1
   assert any(row['@type']=='Organization' for row in graph)
   assert any(row['@type']=='WebSite' for row in graph)
   for node in graph:
    if node['@type']=='FAQPage':
     visible=' '.join(' '.join(page.text).split())
     for question in node['mainEntity']:
      assert question['name'] in visible
      assert question['acceptedAnswer']['text'] in visible
   if path.startswith('/services/') and path!='/services/':assert any(row['@type']=='Service' for row in graph)
  for tag,a in page.links:
   href=a.get('href','');target=urllib.parse.urlsplit(urllib.parse.urljoin(url,href))
   if target.scheme!='https' or target.netloc!='tidelinestrats.com':continue
   if tag=='link' and a.get('rel')=='canonical':continue
   destination=SITE/urllib.parse.unquote(target.path).lstrip('/')
   assert destination.is_file() or (destination/'index.html').is_file(),(url,href)
   if tag=='a' and not target.fragment:inbound.add(ORIGIN+target.path)
  image=urllib.parse.urlsplit(page.meta['og:image']).path;assert (SITE/image.lstrip('/')).is_file()
 assert set(urls)<=inbound,(set(urls)-inbound)
 assert count==len(urls)
 assert not robots.can_fetch('Googlebot',ORIGIN+'/api/audit/state')
 assert '/loki/' in (SITE/'llms.txt').read_text()
 print(json.dumps({'pages':len(urls),'unique_metadata':True,'schema_matches_visible_faq':True,'schema_csp_hashes':True,'internal_links':True,'public_pages_crawlable':True,'private_api_excluded':True}))
 return urls
if __name__=='__main__':inspect()
