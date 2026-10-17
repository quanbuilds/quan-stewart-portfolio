(function(root){
  'use strict';
  function text(value){return String(value||'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2010-\u2015]/g,'-').replace(/\u2026/g,'...');}
  function create(jsPDF,report,business,date,brand){
    if(!report?.opportunities?.length)throw new Error('A completed plan is needed.');
    brand=brand||root.LokiPDFBrand;
    if(!brand?.display||!brand?.body||!brand?.bold||!brand?.boat)throw new Error('TideLine PDF branding is unavailable.');
    var pdf=new jsPDF({unit:'pt',format:'letter',orientation:'landscape',compress:true});
    [['display','TideDisplay','normal'],['body','TideBody','normal'],['bold','TideBody','bold']].forEach(function(f){pdf.addFileToVFS(f[0]+'.ttf',brand[f[0]]);pdf.addFont(f[0]+'.ttf',f[1],f[2]);});
    pdf.setProperties({title:'Your Loki business plan',author:'TideLine Strategies',subject:'Working audit and two-week action plan'});
    var W=792,H=612,M=42,LIMIT=552;
    var C={navy:'#1B3A5C',deep:'#122A44',ink:'#20303F',steel:'#647485',ice:'#DCEBF5',tint:'#F3F8FB',line:'#E3EBF1',white:'#FFFFFF',blue:'#3E7CB1',green:'#277A70',amber:'#89682F'};
    function fill(c){pdf.setFillColor(c);}function font(size,kind,color){pdf.setFont(kind==='display'?'TideDisplay':'TideBody',kind==='bold'?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(color||C.ink);}
    function lines(value,width,size,kind){font(size,kind);return pdf.splitTextToSize(text(value),width);}
    function write(value,x,y,width,o){o=o||{};var size=o.size||11,leading=o.leading||size*1.4,list=Array.isArray(value)?value:lines(value,width,size,o.kind);font(size,o.kind,o.color);list.forEach(function(line){pdf.text(line,x,y);y+=leading;});return y;}
    function label(value,x,y,color){font(8,'bold',color||C.blue);pdf.setCharSpace(1.1);pdf.text(text(value).toUpperCase(),x,y);pdf.setCharSpace(0);}
    function box(x,y,w,h,color,r){fill(color);if(r)pdf.roundedRect(x,y,w,h,r,r,'F');else pdf.rect(x,y,w,h,'F');}
    function boat(x,y,size){pdf.addImage('data:image/png;base64,'+brand.boat,'PNG',x,y,size,size/brand.boatRatio,undefined,'FAST');}
    function wave(){fill(C.ice);pdf.path([{op:'m',c:[0,583]},{op:'c',c:[190,569,450,607,792,579]},{op:'l',c:[792,612]},{op:'l',c:[0,612]},{op:'h',c:[]}]);pdf.fill();}
    function base(chapter,add){if(add)pdf.addPage();box(0,0,W,H,C.white);boat(M,19,30);write('TideLine',M+40,38,150,{kind:'display',size:21,color:C.deep});label('LOKI / '+chapter,490,35,C.steel);pdf.setDrawColor(C.line);pdf.line(M,61,W-M,61);wave();}
    function footer(){var n=pdf.getNumberOfPages();for(var i=1;i<=n;i++){pdf.setPage(i);font(8,'normal',C.navy);pdf.text('TideLine Strategies  /  tidelinestrats.com',M,596);pdf.text(String(i).padStart(2,'0')+' / '+String(n).padStart(2,'0'),W-M,596,{align:'right'});}}
    // Flow two independent columns over the same set of continuation pages.
    function flow(blocks,x,width,records,newRecord){
      var pi=0,y=records[0].top;pdf.setPage(records[0].page);
      function next(){pi++;if(!records[pi])records.push(newRecord(true));pdf.setPage(records[pi].page);y=records[pi].top;}
      blocks.filter(function(b){return b.value;}).forEach(function(b){
        var size=b.size||11,leading=size*1.4,indent=b.number?28:0;
        var list=lines(b.value,width-indent,size,b.kind);
        var head=b.label?(b.logo?36:19):0;
        if(b.reserve && b.reserve <= LIMIT-records[pi].top && y+b.reserve>LIMIT)next();
        if(y+head+Math.min(list.length,2)*leading+8>LIMIT)next();
        if(b.logo){pdf.addImage('data:image/png;base64,'+b.logo,'PNG',x,y-10,30,30,undefined,'FAST');}
        if(b.label){label(b.label,x+(b.logo?42:0),y+3,b.color);y+=b.logo?36:19;}
        if(b.number){box(x,y-11,20,20,C.ice,5);font(10,'bold',C.navy);pdf.text(String(b.number),x+10,y+3,{align:'center'});}
        list.forEach(function(line){if(y+leading>LIMIT)next();font(size,b.kind,b.textColor||C.ink);pdf.text(line,x+indent,y+size*.85);if(b.href)pdf.link(x+indent,y,width-indent,leading,{url:b.href});y+=leading;});y+=b.gap===undefined?16:b.gap;
      });
      return y;
    }
    // Overview: the actual diagnosis, the next move, and the three priorities.
    box(0,0,W,H,C.white);box(0,0,W,348,C.deep);
    write('TideLine',M,43,210,{kind:'display',size:27,color:C.white});label('LOKI / YOUR WORKING BUSINESS PLAN',M,65,C.ice);
    font(9,'normal',C.ice);pdf.text(date||new Date().toLocaleDateString('en-US'),W-M,40,{align:'right'});
    box(632,93,118,118,C.ice,18);boat(644,102,94);
    var sy=write(report.synthesis?.headline||'Your next moves, in order',M,112,552,{kind:'display',size:30,leading:35,color:C.white});
    sy=write(report.synthesis?.connection||report.reply,M,sy+12,546,{size:10.5,leading:14,color:C.ice});
    var heroEnd=Math.max(278,sy+12);box(0,heroEnd,W,H-heroEnd,C.white);
    var first=report.synthesis?.firstMove||report.opportunities[0].firstStep;
    var firstLines=lines(first,660,14,'bold'),bandH=35+firstLines.length*19;
    box(M,heroEnd+18,W-M*2,bandH,C.ice,10);label('START WITH THIS',M+18,heroEnd+37,C.navy);write(firstLines,M+18,heroEnd+59,660,{size:14,kind:'bold',leading:19,color:C.deep});
    var cy=heroEnd+bandH+44,cw=(W-M*2-24)/3;
    var maxOverview=Math.max.apply(null,report.opportunities.slice(0,3).map(function(item){return lines(item.title,cw-10,16,'display').length*21;}));
    if(cy+28+maxOverview>LIMIT){wave();base('YOUR PRIORITIES',true);cy=112;}
    report.opportunities.slice(0,3).forEach(function(item,i){var x=M+i*(cw+12);pdf.setDrawColor(C.line);pdf.line(x,cy-10,x+cw,cy-10);label(['01 / DO FIRST','02 / NEXT, WHEN READY','03 / KEEP IT WORKING'][i],x,cy+4,C.blue);write(item.title,x,cy+28,cw-10,{kind:'display',size:16,leading:21,color:C.deep});});wave();
    // One editorial spread for each priority, with the how-to and checks side by side.
    report.opportunities.forEach(function(item,index){
      function record(continued){base('PRIORITY '+(index+1)+(continued?' / CONTINUED':''),true);label('0'+(index+1)+' / '+(index===0?'THE FIRST CHANGE':'BUILD ON WHAT WORKS'),M,85,C.blue);
        var ty=write(item.title,M,119,620,{kind:'display',size:28,leading:33,color:C.deep});
        var meta=[item.owner||'Agree on an owner',item.timing||'During the pilot'].join('  /  ');ty=write(meta,M,ty+1,650,{size:10,kind:'bold',color:C.steel,leading:14});
        pdf.setDrawColor(C.line);pdf.line(488,ty+7,488,LIMIT-4);return{page:pdf.getCurrentPageInfo().pageNumber,top:ty+24};}
      var records=[record(false)];
      flow([{label:'THE FIRST MOVE',value:item.firstStep,kind:'bold',size:12},{label:'WHY THIS MATTERS',value:item.evidence,size:10.5}].concat((item.steps||[item.firstStep]).map(function(step,n){return{label:n===0?'HOW TO DO IT':null,number:n+1,value:step,size:11};})),M,418,records,record);
      flow([{label:"YOU'RE DONE WHEN",value:item.doneWhen,color:C.green},{label:'IF IT GETS STUCK',value:item.fallback,color:C.amber},{label:'CHECK THE RESULT',value:item.metric},{label:'LET AI HELP',value:item.aiHelp}],512,238,records,record);
    });
    // The pilot is a team working page, not a decorative cover.
    base('YOUR NEXT TWO WEEKS',true);label('TRY ONE CHANGE. CHECK WHAT HAPPENS.',M,90,C.blue);write('A small pilot. A clear decision.',M,124,670,{kind:'display',size:29,color:C.deep});
    box(M,156,708,70,C.ice,10);label('THE CHANGE WE ARE TRYING',M+18,177,C.navy);write(first,M+18,201,668,{kind:'bold',size:12,leading:16});
    var pilotRecords=[{page:pdf.getCurrentPageInfo().pageNumber,top:255}];
    function pilotRecord(){base('PILOT / CONTINUED',true);write('Your next two weeks',M,110,670,{kind:'display',size:27,color:C.deep});return{page:pdf.getCurrentPageInfo().pageNumber,top:145};}
    flow([{label:'THE PLAN',value:report.pilot,size:12},{label:'YOUR BUSINESS',value:business,size:10.5}],M,434,pilotRecords,pilotRecord);
    flow([{label:'DAYS 1-3',value:'Record a few real examples before changing the process. Agree who owns the next step.'},{label:'DAYS 4-14',value:'Repeat the small change. Compare the same simple counts, then decide what to keep or change.'},{label:'BEFORE EXPANDING',value:'Review one sample with the people doing the work. Ask Loki to adapt any owner, timing or assumption that does not fit.'}],512,238,pilotRecords,pilotRecord);
    var aiItems=report.opportunities.filter(function(item){return item.aiPrompt;});
    if(aiItems.length){
      function aiRecord(continued){base('AI WORKING NOTES'+(continued?' / CONTINUED':''),true);label('YOUR TEAM CAN COPY THESE PROMPTS',M,87,C.blue);write('Let AI take the first pass.',M,120,670,{kind:'display',size:29,color:C.deep});return{page:pdf.getCurrentPageInfo().pageNumber,top:156};}
      var ar=[aiRecord(false)];var aiBlocks=[];
      aiItems.forEach(function(item,i){aiBlocks.push({label:'0'+(i+1)+' / '+item.title,value:item.aiHelp,size:11},{label:'PROMPT TO COPY',value:item.aiPrompt,size:11},{label:'A PERSON CHECKS',value:item.humanCheck,size:10.5},{label:'LATER, IF USEFUL',value:item.automation,size:10.5,gap:28});});
      for(var ai=0;ai<aiBlocks.length;ai+=4){
        var group=aiBlocks.slice(ai,ai+4);aiBlocks[ai].reserve=group.reduce(function(sum,b){return sum+(b.label?19:0)+lines(b.value,540,b.size||11,b.kind).length*(b.size||11)*1.4+(b.gap===undefined?16:b.gap);},0);
      }
      flow(aiBlocks,M,540,ar,aiRecord);
      // An intentional quiet margin for the team's review notes.
      ar.forEach(function(r){pdf.setPage(r.page);label('TEAM NOTES',630,164,C.steel);pdf.setDrawColor(C.line);for(var yy=190;yy<540;yy+=24)pdf.line(630,yy,750,yy);});
    }
    if(report.tools?.length){
      function toolRecord(continued){base('OPTIONAL TOOLS'+(continued?' / CONTINUED':''),true);label('USE WHAT FITS YOUR WORK',M,87,C.blue);write('Tools to consider, not a shopping list.',M,120,690,{kind:'display',size:27,color:C.deep});return{page:pdf.getCurrentPageInfo().pageNumber,top:158};}
      var tr=[toolRecord(false)],tb=[];
      report.tools.forEach(function(tool){tb.push({label:tool.name,logo:brand.tools?.[tool.id||String(tool.name).toLowerCase()],value:tool.fit||tool.description,kind:'bold',size:13,reserve:120},{value:tool.description,size:11},{label:'EXAMPLE BUDGET / USD BEFORE TAX',value:tool.pricing,size:10.5},{label:'WEBSITE',value:tool.url,href:tool.url,size:10,gap:8},{label:'PRICING CHECKED '+(tool.checkedAt||''),value:tool.pricingUrl,href:tool.pricingUrl,size:10,gap:30});});
      for(var ti=0;ti<tb.length;ti+=5){
        tb[ti].reserve=tb.slice(ti,ti+5).reduce(function(sum,b){return sum+(b.label?(b.logo?36:19):0)+lines(b.value,708,b.size||11,b.kind).length*(b.size||11)*1.4+(b.gap===undefined?16:b.gap);},0);
      }
      flow(tb,M,708,tr,toolRecord);
    }
    footer();return pdf;
  }
  root.LokiPlanPDF={create:create};if(typeof module==='object'&&module.exports)module.exports=root.LokiPlanPDF;
})(typeof globalThis!=='undefined'?globalThis:this);
