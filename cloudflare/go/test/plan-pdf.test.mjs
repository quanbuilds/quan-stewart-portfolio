import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {jsPDF}=require('../../../signallabs/vendor/jspdf-4.2.1.umd.min.js');
globalThis.LokiPDFBrand=require('../../../signallabs/loki-pdf-brand.js');
const {create}=require('../../../signallabs/loki-plan-pdf.js');
const {clean}=require('../../../signallabs/loki-text.js');

test('old session labels are cleaned without deleting ordinary business language',()=>{
 assert.equal(clean('Who can cover that? afternoon coverage'),'Who can cover that?');
 assert.equal(clean('What happens next? arrival'),'What happens next?');
 assert.equal(clean("How does that work?', handoff"),'How does that work?');
 assert.equal(clean('Which tools do you use?'),'Which tools do you use?');
 assert.equal(clean('We need a better handoff'),'We need a better handoff');
});

test('PDF paginates long plans, includes all priorities and excludes unrelated session data',()=>{
 const report={synthesis:{headline:'Give each request a clear next owner',connection:'The office leaves before the requests stop.',firstMove:'Choose who handles requests after 1.'},pilot:'Days 1-3 count missed requests. Days 4-14 try one change.',opportunities:Array.from({length:3},(_,i)=>({title:'Action '+(i+1),firstStep:'Name the next owner.',evidence:'The office leaves at 1.',steps:Array.from({length:3},(_,n)=>'Step '+(n+1)+': '+('Check the sample with the shift lead. '.repeat(30))),doneWhen:'No request is unassigned.',aiHelp:'Draft the handoff checklist.',aiPrompt:'Make a short checklist from these anonymous examples.',humanCheck:'Check names, hours and actual availability.'})),token:'NEVER-INCLUDE-THIS-SESSION-TOKEN'};
 Object.defineProperty(report,'token',{get(){throw new Error('Session data must never enter a PDF.');}});
 const pdf=create(jsPDF,report,'A cleaning company','October 17, 2026');
 assert.ok(pdf.getNumberOfPages()>=5);
 const content=pdf.internal.pages.flat().join('\n');
 assert.ok(pdf.getFontList().TideDisplay);assert.ok(pdf.getFontList().TideBody);assert.doesNotMatch(content,/NEVER-INCLUDE/);
 const bytes=Buffer.from(pdf.output('arraybuffer'));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
 assert.throws(()=>create(jsPDF,{},''),/completed plan/);
});
