// Managed release and provider reconciliation for the owner-supplied services preview.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const commit=process.env.AGENT_RELEASE_COMMIT;assert(commit&&process.env.AGENT_RELEASE_TASK,'Managed release required');assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),commit);
const origin='https://tidelinestrats.com',hash=b=>createHash('sha256').update(b).digest('hex');
const get=async path=>{const r=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'cache-control':'no-cache'}});assert.equal(r.status,200,path+' must be served by the live deployment');return r};
if(process.argv.includes('--apply'))execFileSync('sh',['cloudflare/go/deploy.sh'],{stdio:'inherit',env:{...process.env,TIDELINE_WRANGLER_PROFILE:'tideline'},timeout:240000});
assert(process.argv.some(a=>['--apply','--reconcile','--verify'].includes(a)),'Choose a release operation');
const release=await (await get('/__release.json')).json();assert.equal(release.commit,commit,'Active deployment differs; do not replay blindly');
for(const name of ['index.html','preview.css','tour.js']){const route=name==='index.html'?'/preview/':'/preview/'+name;assert.equal(hash(Buffer.from(await (await get(route)).arrayBuffer())),hash(await fs.readFile('signallabs/preview/'+name)),'Live preview asset differs: '+name)}
if(process.argv.includes('--verify')){
 const file=process.env.TIDELINE_PREVIEW_UI_RECEIPT;assert(file,'Visual acceptance receipt required');const visual=JSON.parse(await fs.readFile(file,'utf8'));assert.equal(visual.commit,commit);for(const key of ['desktopVisualApproved','mobileVisualApproved','tourControlsVerified','sampleDataLabelVerified','navigationVerified','cspVerified'])assert.equal(visual[key],true,key);assert(visual.screenshots?.length>=2);
 assert((await get('/preview/')).headers.get('x-robots-tag')?.includes('noindex'));
 await fs.writeFile(process.env.AGENT_RELEASE_RECEIPT,JSON.stringify({commit,deploymentId:commit,accepted:true,evidence:{origin,preview:'/preview/',assetsVerified:true,visual}},null,2));
}
console.log(JSON.stringify({commit,preview:origin+'/preview/',assetsVerified:true}));
