(function(){
  const $ = id => document.getElementById(id);
  const KEY = 'tideline-loki-owner-v1';
  let session = null, data = null, installPrompt = null, closingStatus = 'done';
  const status = (id, value) => { $(id).textContent = value || ''; };
  const buttonBusy = (button, busy) => { button.disabled = busy; button.setAttribute('aria-busy', String(busy)); };
  const node = (tag, text, className) => { const el = document.createElement(tag); if (text) el.textContent = text; if (className) el.className = className; return el; };
  async function api(path, method = 'GET', body) {
    const headers = { 'accept': 'application/json' };
    if (body) headers['content-type'] = 'application/json';
    if (session) { headers.authorization = 'Bearer ' + session.token; headers['x-loki-owner'] = session.id; }
    const res = await fetch('/api/operator/' + path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    const value = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(value.error || 'request_failed');
    return value;
  }
  function friendly(error) {
    const words = { rate_limited:'Loki is getting too many requests. Try again in a minute.', ai_unavailable:'Loki could not prepare a useful move right now. Please retry.', move_unavailable:'Loki could not prepare the next move. Please retry.', session_not_found:'This browser no longer has access to that workspace.', storage_unavailable:'Workspace storage is temporarily unavailable.' };
    return words[error.message] || 'Something interrupted this step. Please try again.';
  }
  function showWorkspace() { const opening=$('workspace').hidden; $('welcome').hidden = true; $('workspace').hidden = false; if(opening)window.scrollTo({ top:0, behavior:'smooth' }); }
  function showWelcome() { $('workspace').hidden = true; $('welcome').hidden = false; }
  function render() {
    if (!data) return;
    showWorkspace();
    $('business-name').textContent = data.business;
    $('goal-line').textContent = 'Goal: ' + data.goal;
    $('goal-card').textContent = data.goal;
    const moves = data.moves || [], open = moves.find(m => m.status === 'open');
    const chat = $('chat-thread'); chat.replaceChildren();
    if (!data.messages?.length) chat.append(node('p','Ask Loki a question about this move or tell it what is getting in the way.','chat-empty'));
    for (const message of data.messages || []) {
      const bubble=node('div','', 'chat-message ' + (message.role === 'owner' ? 'owner' : 'loki'));
      bubble.append(node('strong',message.role === 'owner' ? 'You' : 'Loki'),node('p',message.content)); chat.append(bubble);
    }
    chat.scrollTop=chat.scrollHeight;
    $('current-move').replaceChildren();
    $('current-move').hidden = !open;
    $('next-wrap').hidden = Boolean(open);
    if (open) {
      $('move-date').textContent = new Date(open.created_at).toLocaleDateString(undefined, { month:'short', day:'numeric' });
      const card = $('current-move');
      card.append(node('h3', open.title), node('p', open.evidence, 'source'));
      const grid = node('div', '', 'move-grid');
      const left = node('div'), right = node('div');
      left.append(node('strong','THE MOVE'),node('p',open.action));
      right.append(node('strong','HOW TO TELL'),node('p',open.metric));
      grid.append(left,right); card.append(grid);
      const question = node('div', '', 'question'); question.append(node('strong','LOKI WANTS TO KNOW'),node('span',open.question)); card.append(question);
      const done = node('button','I tried this →','primary'); done.type='button'; done.addEventListener('click',()=>openOutcome('done',open)); card.append(done);
      const skip = node('button','Skip this move','text-button'); skip.type='button'; skip.style.marginLeft='18px'; skip.addEventListener('click',()=>openOutcome('skipped',open)); card.append(skip);
    }
    const history = $('move-history'); history.replaceChildren();
    const resolved = moves.filter(m=>m.status!=='open');
    if (!resolved.length) history.append(node('p','Your completed moves and observations will appear here.','muted'));
    for (const move of resolved) {
      const item=node('article','','history-item'), copy=node('div'); copy.append(node('h3',move.title),node('p',move.outcome));
      item.append(copy,node('span',move.status,'pill')); history.append(item);
    }
  }
  async function resume() {
    try { session=JSON.parse(localStorage.getItem(KEY)||'null'); } catch { session=null; }
    if (!session?.id || !session?.token) return;
    try { data=await api('state'); render(); }
    catch(error){ if(error.message==='session_not_found') { localStorage.removeItem(KEY); session=null; showWelcome(); } else status('start-status',friendly(error)); }
  }
  $('start-form').addEventListener('submit',async event=>{
    event.preventDefault(); const button=$('start-form').querySelector('button[type=submit]'); buttonBusy(button,true); status('start-status','Loki is thinking through your first move…');
    const payload={business:$('business').value.trim(),goal:$('goal').value.trim()};
    try {
      const audit=JSON.parse(sessionStorage.getItem('tideline-loki-audit')||'null');
      if(audit?.id && audit?.token){payload.auditId=audit.id;payload.auditToken=audit.token;}
    } catch {}
    try { const created=await api('start','POST',payload); session={id:created.id,token:created.token}; localStorage.setItem(KEY,JSON.stringify(session)); data=created; render(); status('start-status',''); }
    catch(error){ if(error.message==='completed_audit_required' && payload.auditId){delete payload.auditId;delete payload.auditToken;try {const created=await api('start','POST',payload);session={id:created.id,token:created.token};localStorage.setItem(KEY,JSON.stringify(session));data=created;render();status('start-status','');return;}catch(error2){error=error2;}} status('start-status',friendly(error)); }
    finally{buttonBusy(button,false);}
  });
  function openOutcome(kind,move){closingStatus=kind;$('outcome-prompt').textContent=kind==='done'?'What did you observe when you tried “'+move.title+'”?':'What made “'+move.title+'” the wrong move?';$('outcome-text').value='';$('outcome-dialog').dataset.moveId=move.id;$('outcome-dialog').showModal();$('outcome-text').focus();}
  $('cancel-outcome').addEventListener('click',()=> $('outcome-dialog').close());
  $('outcome-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('save-outcome');buttonBusy(button,true);try{const result=await api('outcome','POST',{moveId:$('outcome-dialog').dataset.moveId,status:closingStatus,outcome:$('outcome-text').value.trim()});data.moves=result.moves;$('outcome-dialog').close();render();status('work-status','Saved. Loki will use your observation for the next move.');}catch(error){status('work-status',friendly(error));$('outcome-dialog').close();}finally{buttonBusy(button,false);}});
  $('next-move').addEventListener('click',async()=>{const button=$('next-move');buttonBusy(button,true);status('work-status','Loki is preparing the next move…');try{const result=await api('next','POST',{});data.moves=result.moves;render();status('work-status','');}catch(error){status('work-status',friendly(error));}finally{buttonBusy(button,false);}});
  $('chat-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('chat-form').querySelector('button');const message=$('chat-input').value.trim();if(!message)return;buttonBusy(button,true);status('chat-status','Loki is thinking…');try{const result=await api('message','POST',{message});data.messages=result.messages;$('chat-input').value='';render();status('chat-status','');}catch(error){status('chat-status',error.message==='conversation_limit'?'You have reached this hour’s conversation limit. Try later.':friendly(error));}finally{buttonBusy(button,false);}});
  $('change-goal').addEventListener('click',()=>{$('new-goal').value=data.goal;$('goal-dialog').showModal();});
  $('cancel-goal').addEventListener('click',()=> $('goal-dialog').close());
  $('goal-form').addEventListener('submit',async event=>{event.preventDefault();try{const result=await api('goal','POST',{goal:$('new-goal').value.trim()});data.goal=result.goal;$('goal-dialog').close();render();status('work-status','Goal updated.');}catch(error){status('work-status',friendly(error));$('goal-dialog').close();}});
  $('delete-workspace').addEventListener('click',async()=>{if(!confirm('Delete this Loki workspace and its move history? This cannot be undone.'))return;try{await api('delete','DELETE');localStorage.removeItem(KEY);session=null;data=null;showWelcome();status('start-status','Workspace deleted.');}catch(error){status('work-status',friendly(error));}});
  $('theme').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('tideline-loki-theme',document.body.classList.contains('dark')?'dark':'light');});
  if(localStorage.getItem('tideline-loki-theme')==='dark')document.body.classList.add('dark');
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('install').hidden=false;});
  $('install').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('install').hidden=true;});
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/loki/sw.js',{scope:'/loki/'}).catch(()=>{});
  try {
    const audit=JSON.parse(sessionStorage.getItem('tideline-loki-audit')||'null');
    if(audit?.id && audit?.token)fetch('/api/audit/state',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(audit)}).then(r=>r.ok?r.json():null).then(value=>{if(value?.business && !$('business').value)$('business').value=value.business;}).catch(()=>{});
  } catch {}
  resume();
})();
