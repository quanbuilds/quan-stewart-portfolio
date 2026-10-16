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
  var count = 0;

  function el(tag, className, value){ var node = document.createElement(tag); if(className) node.className = className; if(value) node.textContent = value; return node; }
  function bubble(who, value){
    var item = el('div', 'audit-bubble audit-bubble-' + who);
    item.append(el('div', 'audit-bubble-who', who === 'loki' ? 'Loki' : 'You'));
    item.append(el('p', '', value));
    transcript.append(item);
    transcript.scrollTop = transcript.scrollHeight;
  }
  function showMessage(message){
    if(message.reply || message.question) bubble('loki', [message.reply, message.question].filter(Boolean).join(' '));
    insightsList.replaceChildren();
    var list = Array.isArray(message.insights) && message.insights.length ? message.insights : ['Loki is tracing your workflow.'];
    list.forEach(function(value){ insightsList.append(el('li', '', value)); });
    if(message.ready){ showResult(message); } else { answerInput.focus(); }
  }
  function showResult(message){
    answerForm.hidden = false;
    answerInput.placeholder = 'Ask a question, push back, or tell me what I missed…';
    finishButton.hidden = true;
    result.hidden = false;
    transcript.append(result);
    var toolList = document.getElementById('auditTools');
    toolList.replaceChildren();
    opportunities.replaceChildren();
    (message.opportunities || []).forEach(function(item, i){
      var card = el('article', 'audit-opportunity');
      card.append(el('span', 'audit-opportunity-number', '0' + (i + 1)));
      card.append(el('h3', '', item.title));
      [['Why Loki chose this', item.evidence], ['Start this week', item.firstStep], ['Where AI may help', item.automation], ['Measure', item.metric]].forEach(function(pair){
        var p = el('p'); p.append(el('strong', '', pair[0] + ': ')); p.append(document.createTextNode(pair[1] || '—')); card.append(p);
      });
      card.append(askButton('Talk this through', 'Can we talk through “' + item.title + '”? What would this look like for us?'));
      card.append(askButton('That’s not quite right', 'I’d like to correct the assumption behind “' + item.title + '”: '));
      opportunities.append(card);
    });
    pilot.textContent = message.pilot || 'Select the first opportunity, test it with your team, and compare the outcome after two weeks.';
    (message.tools || []).forEach(function(tool){
      var card = el('article', 'audit-tool');
      var logo = el('img'); logo.src = tool.logo; logo.alt = ''; logo.width = 32; logo.height = 32;
      logo.addEventListener('error', function(){ logo.hidden = true; });
      card.append(logo, el('h3', '', tool.name), el('p', '', tool.description), el('p', '', tool.fit), el('p', 'audit-tool-price', tool.pricing));
      var link = el('a', '', 'Visit ' + tool.name + ' ↗'); link.href = tool.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      var pricing = el('a', '', 'Pricing · checked ' + tool.checkedAt); pricing.href = tool.pricingUrl; pricing.target = '_blank'; pricing.rel = 'noopener noreferrer';
      card.append(link, pricing, askButton('Ask Loki about ' + tool.name, 'How would ' + tool.name + ' fit our workflow? Explain the likely cost, limitations, and whether our existing tools could do the same job.'));
      toolList.append(card);
    });
    document.getElementById('auditToolsSection').hidden = !toolList.children.length;
    status.textContent = 'What feels useful — and what did I miss?';
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function askButton(label, prompt){
    var button = el('button', 'audit-discuss', label); button.type = 'button';
    button.addEventListener('click', function(){ answerInput.value = prompt; answerInput.focus(); });
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
      var data = await post('/api/audit/start', {business:business});
      session = {id:data.id, token:data.token};
      try { sessionStorage.setItem('tideline-loki-audit', JSON.stringify(session)); } catch (_) {}
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
    status.textContent = 'Loki is thinking through that…';
    try {
      var data = await post('/api/audit/turn', {id:session.id, token:session.token, answer:answer});
      bubble('you', answer); answerInput.value = ''; count += 1;
      status.textContent = ''; showMessage(data.message);
      if(count >= 4 && !data.message.ready){ answerInput.placeholder = 'Answer Loki, or ask for your audit now…'; finishButton.hidden = false; }
    } catch(error){ status.textContent = errorText(error); }
    finally { setBusy(sendButton, false); answerForm.setAttribute('aria-busy', 'false'); answerInput.readOnly = false; answerInput.focus(); }
  });
  finishButton.addEventListener('click', function(){ answerInput.value = 'Please finish the audit with your best current diagnosis. Mark any assumptions.'; answerForm.requestSubmit(); });
  document.getElementById('auditPrint').addEventListener('click', function(){ window.print(); });
  document.getElementById('auditDelete').addEventListener('click', async function(){
    if(!session || !window.confirm('Delete this audit and its conversation?')) return;
    try {
      await post('/api/audit/delete', session);
      try { sessionStorage.removeItem('tideline-loki-audit'); } catch (_) {}
      session = null; transcript.replaceChildren(); opportunities.replaceChildren();
      workspace.hidden = true; result.hidden = true; onboard.hidden = false; businessInput.value = '';
      startStatus.textContent = 'Your audit was deleted.';
      businessInput.focus();
    } catch(error){ status.textContent = error.code === 'text_enrollment_active' ? 'This audit is linked to earlier text enrollment. Contact TideLine to remove that record.' : errorText(error); }
  });
  try {
    var saved = JSON.parse(sessionStorage.getItem('tideline-loki-audit') || 'null');
    if(saved?.id && saved?.token) post('/api/audit/state', saved).then(function(data){
      session = saved; onboard.hidden = true; workspace.hidden = false;
      bubble('you', data.business);
      (data.turns || []).forEach(function(turn){ if(turn.reply || turn.question) bubble('loki', [turn.reply,turn.question].filter(Boolean).join(' ')); bubble('you', turn.answer); });
      if(data.report && !data.message.ready) showResult(data.report);
      count = (data.turns || []).length; showMessage(data.message);
      if(count >= 4 && !data.message.ready) finishButton.hidden = false;
    }).catch(function(){ sessionStorage.removeItem('tideline-loki-audit'); });
  } catch (_) {}
})();
