(function(){
  var startButton = document.getElementById('auditStart');
  var businessInput = document.getElementById('auditBusiness');
  var onboard = document.getElementById('auditOnboard');
  var workspace = document.getElementById('auditWorkspace');
  var transcript = document.getElementById('auditTranscript');
  var answerForm = document.getElementById('auditAnswerForm');
  var answerInput = document.getElementById('auditAnswer');
  var status = document.getElementById('auditStatus');
  var startStatus = document.getElementById('auditStartStatus');
  var finishButton = document.getElementById('auditFinish');
  var insightsList = document.getElementById('auditInsights');
  var result = document.getElementById('auditResult');
  var opportunities = document.getElementById('auditOpportunities');
  var pilot = document.getElementById('auditPilot');
  if (!startButton) return;
  var session = null;
  var savedKey = 'tideline-loki-saved-audit-v1';
  var saveForm = document.getElementById('auditSaveForm');
  var saveStatus = document.getElementById('auditSaveStatus');
  // Retire the old anonymous refresh credential; only explicit email saves may resume.
  try { sessionStorage.removeItem('tideline-loki-audit'); } catch (_) {}
  function forgetSaved(){try {localStorage.removeItem(savedKey);} catch (_) {}}
  function showSaved(email){document.getElementById('auditEmail').value=email;document.getElementById('auditSaveLabel').textContent='Saved';document.getElementById('auditSaveMenu').open=false;saveStatus.textContent='Saved for '+email+'. Your Loki will remember this conversation when you refresh this browser.';}
  var count = 0;
  var hasReport = false;
  var businessContext = '';
  var pdfUrl = null;
  var thinkingIndex = 0;

  function el(tag, className, value){ var node = document.createElement(tag); if(className) node.className = className; if(value) node.textContent = value; return node; }
  function bubble(who, value){
    var item = el('div', 'audit-bubble audit-bubble-' + who);
    item.append(el('div', 'audit-bubble-who', who === 'loki' ? 'Loki' : 'You'));
    item.append(el('p', '', who === 'loki' ? window.LokiText.clean(value) : value));
    transcript.append(item);
    transcript.scrollTop = transcript.scrollHeight;
    return item;
  }
  function showMessage(message){
    if(message.reply || message.question) bubble('loki', [window.LokiText.clean(message.reply), window.LokiText.clean(message.question)].filter(Boolean).join(' '));
    insightsList.replaceChildren();
    var list = Array.isArray(message.insights) && message.insights.length ? message.insights : ['Loki is tracing your workflow.'];
    list.forEach(function(value){ insightsList.append(el('li', '', value)); });
    if(message.ready){ showResult(message); } else { answerInput.focus({preventScroll:true}); }
  }
  function showResult(message){
    hasReport = true;
    updatePDF(message);
    answerForm.hidden = false;
    answerInput.placeholder = 'Ask a question, push back, or tell me what I missed…';
    finishButton.hidden = true;
    result.hidden = false;
    transcript.append(result);
    var toolList = document.getElementById('auditTools');
    toolList.replaceChildren();
    opportunities.replaceChildren();
    var synthesis = message.synthesis || {};
    document.getElementById('auditDiagnosis').textContent = synthesis.headline || 'Your next moves, in order';
    document.getElementById('auditConnection').textContent = synthesis.connection || message.reply || 'Start with the first priority, then build on what works.';
    var firstMove = document.getElementById('auditFirstMove');
    firstMove.replaceChildren(el('span', 'audit-label', 'Start here'), el('strong', '', synthesis.firstMove || message.opportunities?.[0]?.firstStep || 'Choose one small workflow to test.'));
    var overview = document.getElementById('auditOverview'); overview.replaceChildren();
    (message.opportunities || []).forEach(function(item, i){
      var card = el('details', 'audit-opportunity');
      var summary = el('summary', 'audit-action-summary');
      var heading = el('div', 'audit-action-heading');
      heading.append(el('span', 'audit-rank', '0' + (i + 1)), el('h3', '', item.title), el('span', 'audit-expand', 'View steps'));
      summary.append(heading);
      summary.append(el('p', 'audit-takeaway', item.takeaway || item.firstStep));
      var meta = el('div', 'audit-action-meta');
      meta.append(el('span', '', item.owner || 'Choose an owner'), el('span', '', item.timing || (i === 0 ? 'Next 48 hours' : 'During the pilot')));
      summary.append(meta);
      if(item.takeaway) { var move = el('p', 'audit-action-first'); move.append(el('strong', '', 'First move: '), document.createTextNode(item.firstStep)); summary.append(move); }
      card.append(summary);
      var body = el('div', 'audit-action-body');
      body.append(el('div', 'audit-label', 'Why this matters'), el('p', '', item.evidence));
      if(item.steps?.length){ var steps = el('ol', 'audit-execution'); item.steps.forEach(function(step){steps.append(el('li', '', step));}); body.append(el('h4', '', 'How to execute'), steps); }
      else { body.append(el('h4', '', 'How to begin'), el('p', '', item.firstStep)); }
      [['You’re done when', item.doneWhen], ['If it stalls', item.fallback], ['Check the result', item.metric], ['Let AI help', item.aiHelp], ['Check before using', item.humanCheck], ['Connect later, if useful', item.automation]].forEach(function(pair){
        if(!pair[1]) return;
        var block = el('div', pair[0] === 'If it stalls' ? 'audit-check audit-recovery' : 'audit-check');
        block.append(el('h4', '', pair[0]), el('p', '', pair[1])); body.append(block);
      });
      if(item.aiPrompt) body.append(askButton('Use this AI prompt', item.aiPrompt));
      body.append(askButton('Walk me through this', 'Walk me through “' + item.title + '” step by step. Help me choose an owner, verify the first sample, and handle the likeliest snag.'));
      body.append(askButton('Correct this', 'I’d like to correct the assumption behind “' + item.title + '”: '));
      card.append(body); opportunities.append(card);
      var jump = el('button', 'audit-priority-link'); jump.type = 'button';
      jump.append(el('span', 'audit-label', i === 0 ? '01 · Do first' : i === 1 ? '02 · Then' : '03 · Reinforce'), el('strong', '', item.title));
      jump.addEventListener('click', function(){card.open = true;card.scrollIntoView({behavior:'smooth',block:'start'});summary.focus({preventScroll:true});});
      overview.append(jump);
    });
    pilot.textContent = message.pilot || 'Select the first opportunity, test it with your team, and compare the outcome after two weeks.';
    (message.tools || []).forEach(function(tool){
      var card = el('article', 'audit-tool');
      // Resolve branding locally, including reports saved with expired external logo URLs.
      var knownLogos = {trello:'/assets/tools/trello.ico',calendly:'/assets/tools/calendly.ico',zapier:'/assets/tools/zapier.ico'};
      var toolKey = String(tool.id || tool.name || '').trim().toLowerCase();
      var logo = el('img'); logo.src = knownLogos[toolKey] || tool.logo; logo.alt = ''; logo.width = 32; logo.height = 32;
      logo.style.flexShrink = '0';
      logo.addEventListener('error', function(){
        var embedded = window.LokiPDFBrand && window.LokiPDFBrand.tools && window.LokiPDFBrand.tools[toolKey];
        if(embedded && !logo.dataset.usedFallback){logo.dataset.usedFallback='true';logo.src='data:image/png;base64,'+embedded;}
        else logo.hidden = true;
      });
      var heading = el('div', 'audit-tool-heading'); heading.append(logo, el('h3', '', tool.name));
      card.append(heading, el('p', 'audit-tool-fit', tool.fit || tool.description));
      if(tool.priceLabel) card.append(el('p', 'audit-price-badge', tool.priceLabel));
      var more = el('details', 'audit-tool-details'); more.append(el('summary', '', 'Fit, pricing & links'));
      more.append(el('p', '', tool.description), el('p', 'audit-tool-price', tool.pricing));
      var link = el('a', '', 'Visit ' + tool.name + ' ↗'); link.href = tool.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      var pricing = el('a', '', 'Pricing · checked ' + tool.checkedAt); pricing.href = tool.pricingUrl; pricing.target = '_blank'; pricing.rel = 'noopener noreferrer';
      more.append(link, pricing);
      card.append(more, askButton('Ask about ' + tool.name, 'How would ' + tool.name + ' fit our workflow? Explain the likely cost, limitations, and whether our existing tools could do the same job.'));
      toolList.append(card);
    });
    document.getElementById('auditToolsSection').hidden = !toolList.children.length;
    status.textContent = 'What feels useful — and what did I miss?';
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function updatePDF(message){
    var open = document.getElementById('auditPlanOpen');
    var save = document.getElementById('auditPlanSave');
    try {
      var pdf = window.LokiPlanPDF.create(window.jspdf.jsPDF, message, businessContext);
      var nextUrl = URL.createObjectURL(pdf.output('blob'));
      var previousUrl = pdfUrl; pdfUrl = nextUrl;
      [open,save].forEach(function(link){link.href=pdfUrl;link.removeAttribute('aria-disabled');});
      if(previousUrl) URL.revokeObjectURL(previousUrl);
      document.getElementById('auditPDFStatus').textContent = 'PDF ready to save or share with your team.';
    } catch(error){
      if(pdfUrl) URL.revokeObjectURL(pdfUrl);pdfUrl=null;
      [open,save].forEach(function(link){link.removeAttribute('href');link.setAttribute('aria-disabled','true');});
      document.getElementById('auditPDFStatus').textContent = 'The PDF could not be created. You can still read the plan below or print it.';
    }
  }
  function askButton(label, prompt){
    var button = el('button', 'audit-discuss', label); button.type = 'button';
    button.addEventListener('click', function(){ answerInput.value = prompt; answerInput.focus({preventScroll:true}); });
    return button;
  }
  async function post(path, body){
    var response = await fetch(path, { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify(body) });
    var data = await response.json();
    if (!response.ok || !data.ok) { var error = new Error(data.error || 'request_failed'); error.code = data.error; throw error; }
    return data;
  }
  function errorText(error){
    if(error.code === 'rate_limited') return 'Loki has reached the current request limit. Please wait a minute and retry.';
    if(error.code === 'ai_unavailable') return 'Loki is temporarily unavailable. Your last answer was not lost; please retry.';
    if(error.code === 'storage_unavailable') return 'Loki could not save this step. Please retry.';
    return 'That step did not go through. Please retry.';
  }
  function setBusy(button, busy){ button.disabled = busy; button.setAttribute('aria-busy', String(busy)); }
  startButton.addEventListener('click', async function(){
    var business = businessInput.value.trim();
    if(business.length < 8){ businessInput.focus(); return; }
    setBusy(startButton, true);
    startStatus.textContent = 'Loki is preparing your first question…';
    try {
      var data = await post('/api/audit/start', {business:business,analytics:window.TideLineAnalytics?.context()});
      session = {id:data.id, token:data.token}; count=0; hasReport=false; businessContext = business;
      saveStatus.textContent = '';
      document.getElementById('auditSaveLabel').textContent='Save conversation';
      document.getElementById('auditSaveMenu').open=false;
      onboard.hidden = true; workspace.hidden = false;
      bubble('you', business); showMessage(data.message);
    } catch (error) { startStatus.textContent = errorText(error); }
    finally { setBusy(startButton, false); }
  });
  businessInput.addEventListener('keydown', function(event){ if(event.key === 'Enter'){ event.preventDefault(); startButton.click(); } });
  answerForm.addEventListener('submit', async function(event){
    event.preventDefault(); if(!session || answerForm.getAttribute('aria-busy') === 'true') return;
    var answer = answerInput.value.trim(); if(!answer) return;
    var sendButton = answerForm.querySelector('button[type="submit"]'); setBusy(sendButton, true); answerForm.setAttribute('aria-busy', 'true'); answerInput.readOnly = true;
    var userBubble = bubble('you', answer);
    var pending = null;
    var preparingPlan = !hasReport && count >= 3;
    var thinking = preparingPlan ? ["Give me a moment to look over what you've shared.", "One minute - I'm putting the pieces together.", "Let me pull this into a plan you can use."] : ["Let me think that through.", "One moment - I'm looking at that."];
    var timer = setTimeout(function(){pending=bubble('loki',thinking[thinkingIndex++ % thinking.length]);pending.classList.add('audit-thinking');pending.setAttribute('aria-busy','true');},800);
    status.textContent = '';
    try {
      var data = await post('/api/audit/turn', {id:session.id, token:session.token, answer:answer});
      clearTimeout(timer); if(pending) pending.remove();
      answerInput.value = ''; count += 1;
      showMessage(data.message);
      if(count >= 4 && !data.message.ready && !hasReport){ answerInput.placeholder = 'Answer Loki, or ask for your audit now…'; finishButton.hidden = false; }
    } catch(error){ clearTimeout(timer); if(pending) pending.remove(); userBubble.remove(); status.textContent = errorText(error); }
    finally { clearTimeout(timer); setBusy(sendButton, false); answerForm.setAttribute('aria-busy', 'false'); answerInput.readOnly = false; answerInput.focus({preventScroll:true}); }
  });
  finishButton.addEventListener('click', function(){ answerInput.value = 'Please finish the audit with your best current diagnosis. Mark any assumptions.'; answerForm.requestSubmit(); });
  document.getElementById('auditPrint').addEventListener('click', function(){ window.print(); });
  document.getElementById('auditDelete').addEventListener('click', async function(){
    if(!session || !window.confirm('Delete this audit and its saved Loki memory? Your CRM contact record, if created, will remain with TideLine.')) return;
    try {
      await post('/api/audit/delete', session);
      forgetSaved();
      session = null; count=0; hasReport = false; businessContext = ''; if(pdfUrl) URL.revokeObjectURL(pdfUrl); pdfUrl=null; result.remove(); transcript.replaceChildren(); opportunities.replaceChildren();
      workspace.hidden = true; result.hidden = true; document.querySelector(".audit-wrap").append(result); onboard.hidden = false; businessInput.value = '';
      startStatus.textContent = 'Your audit was deleted.';
      businessInput.focus();
    } catch(error){ status.textContent = error.code === 'text_enrollment_active' ? 'This audit is linked to earlier text enrollment. Contact TideLine to remove that record.' : errorText(error); }
  });
  saveForm.addEventListener('submit', async function(event){
    event.preventDefault(); if(!session || saveForm.getAttribute('aria-busy')==='true') return;
    var button=saveForm.querySelector('button');setBusy(button,true);saveForm.setAttribute('aria-busy','true');
    saveStatus.textContent='Saving your Loki…';
    try {
      var data=await post('/api/audit/save',{id:session.id,token:session.token,email:document.getElementById('auditEmail').value.trim(),consent:true,analytics:window.TideLineAnalytics?.context()});
      try {localStorage.setItem(savedKey,JSON.stringify(session));showSaved(data.email);document.getElementById('auditSaveToggle').focus({preventScroll:true});}
      catch (_) {saveStatus.textContent='Saved to your private workspace. This browser blocks storage, so it cannot resume automatically after refresh.';}
    } catch(error){saveStatus.textContent=error.code==='audit_already_saved'?'This conversation is already saved with another email.':errorText(error);}
    finally {setBusy(button,false);saveForm.setAttribute('aria-busy','false');}
  });
  try {
    var saved = JSON.parse(localStorage.getItem(savedKey) || 'null');
    if(saved?.id && saved?.token) {
      setBusy(startButton,true);
      post('/api/audit/state', saved).then(function(data){
        if(!data.saved){forgetSaved();return;}
        session = saved; businessContext = data.business || ''; onboard.hidden = true; workspace.hidden = false;
        showSaved(data.email);
        bubble('you', data.business);
        (data.turns || []).forEach(function(turn){ if(turn.reply || turn.question) bubble('loki', [window.LokiText.clean(turn.reply),window.LokiText.clean(turn.question)].filter(Boolean).join(' ')); bubble('you', turn.answer); });
        if(data.report && !data.message.ready) showResult(data.report);
        count = (data.turns || []).length; showMessage(data.message);
        if(count >= 4 && !data.message.ready && !hasReport) finishButton.hidden = false;
      }).catch(function(error){
        if(error.code==='audit_not_found') forgetSaved();
        startStatus.textContent='Your saved Loki could not be loaded. Refresh to retry, or start a new conversation.';
      }).finally(function(){setBusy(startButton,false);});
    }
  } catch (_) {forgetSaved();}
})();
