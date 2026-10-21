import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../../signallabs/loki-audit.js',import.meta.url),'utf8');
class Element {
 constructor(){this.hidden=false;this.value='';this.listeners={};this.attributes={};this.children=[];this.dataset={};}
 addEventListener(name,fn){this.listeners[name]=fn;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(k,v){this.attributes[k]=v;}
 getAttribute(k){return this.attributes[k];}
 removeAttribute(k){delete this.attributes[k];}
 focus(){} scrollIntoView(){} remove(){}
 querySelector(){return this.button ||= new Element();}
}
function storage(initial={}){const values=new Map(Object.entries(initial));return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
function page({local=storage(),tab=storage(),fetcher}={}){
 const nodes=new Map(),calls=[];const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};get('auditWorkspace').hidden=true;
 const context={document:{getElementById:get,createElement:()=>new Element(),createTextNode:v=>v,querySelector:()=>new Element()},sessionStorage:tab,localStorage:local,window:{LokiText:{clean:v=>v||''}},URL,setTimeout,clearTimeout};
 context.fetch=async(path,options)=>{const body=JSON.parse(options.body);calls.push({path,body});return {ok:true,json:async()=>fetcher?fetcher(path,body):{ok:true,id:'session-id',token:'private-token',message:{reply:'Hello',question:'What is missing?',insights:[]}}};};
 vm.runInNewContext(source,context);
 return {nodes,get,calls,local,tab,async tick(){await new Promise(resolve=>setImmediate(resolve));},async start(){get('auditBusiness').value='A fictional property management business';await get('auditStart').listeners.click();},async save(){get('auditEmail').value='owner@example.com';await get('auditSaveForm').listeners.submit({preventDefault(){}});}};
}
test('refresh forgets anonymous and legacy sessions, without calling restore',async()=>{
 const tab=storage({'tideline-loki-audit':JSON.stringify({id:'old',token:'secret'})}),local=storage();
 const first=page({tab,local});await first.start();assert.equal(first.get('auditWorkspace').hidden,false);
 assert.equal(tab.getItem('tideline-loki-audit'),null);assert.equal(local.getItem('tideline-loki-saved-audit-v1'),null);
 const refreshed=page({tab,local});await refreshed.tick();assert.equal(refreshed.calls.length,0);assert.equal(refreshed.get('auditWorkspace').hidden,true);
});
test('only a successful explicit email save permits a restored workspace',async()=>{
 const local=storage();const first=page({local,fetcher:(path)=>path.endsWith('/save')?{ok:true,saved:true,email:'owner@example.com'}:{ok:true,id:'saved-id',token:'capability',message:{reply:'Hi',question:'What needs fixing?',insights:[]}}});
 await first.start();await first.save();assert.ok(local.getItem('tideline-loki-saved-audit-v1'));assert.equal(first.calls[1].body.consent,true);
 const restored=page({local,fetcher:()=>({ok:true,saved:true,email:'owner@example.com',business:'Saved business',turns:[{reply:'Hi',question:'What needs fixing?',answer:'Costs'}],message:{reply:'Let us check costs.',question:'What do you pay?',insights:[]}})});
 await restored.tick();assert.equal(restored.get('auditWorkspace').hidden,false);assert.equal(restored.calls[0].path,'/api/audit/state');assert.match(restored.get('auditSaveStatus').textContent,/owner@example.com/);
});
test('an anonymous state cannot be restored by planting a local credential',async()=>{
 const local=storage({'tideline-loki-saved-audit-v1':JSON.stringify({id:'anonymous',token:'capability'})});const p=page({local,fetcher:()=>({ok:true,saved:false,business:'Private anonymous session'})});await p.tick();assert.equal(p.get('auditWorkspace').hidden,true);assert.equal(local.getItem('tideline-loki-saved-audit-v1'),null);
});
