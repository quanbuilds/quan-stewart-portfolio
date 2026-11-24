
var themeToggle = document.getElementById('themeToggle');
var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
var savedTheme;
try { savedTheme = localStorage.getItem('tideline-theme'); } catch (_) {}
function applyTheme(theme){
  document.documentElement.dataset.theme = theme;
  if (!themeToggle) return;
  var dark = theme === 'dark';
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.setAttribute('aria-label', dark ? 'Turn on light mode' : 'Turn on dark mode');
  themeToggle.querySelector('.theme-label').textContent = dark ? 'Light mode' : 'Dark mode';
  themeToggle.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
}
applyTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : (systemDark.matches ? 'dark' : 'light'));
themeToggle?.addEventListener('click', function(){
  var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('tideline-theme', next); } catch (_) {}
});
systemDark.addEventListener?.('change', function(event){
  var preference;
  try { preference = localStorage.getItem('tideline-theme'); } catch (_) {}
  if (preference !== 'dark' && preference !== 'light') applyTheme(event.matches ? 'dark' : 'light');
});
var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var currentPage = 'home';
var pageTransition;
document.querySelectorAll('.tab[data-tab]').forEach(function(btn){
  btn.addEventListener('click', function(){
    var page = btn.dataset.tab;
    if (page === currentPage) return;
    var previous = currentPage;
    currentPage = page;
    function switchPage(){
      if (page !== currentPage) return;
      document.querySelectorAll('.tab[data-tab]').forEach(function(b){
        b.classList.toggle('active', b.dataset.tab === page);
        if (b.dataset.tab === page) b.setAttribute('aria-current','page');
        else b.removeAttribute('aria-current');
      });
      document.querySelectorAll('.tabpanel').forEach(function(p){p.classList.toggle('active',p.id === 'tab-'+page);});
      history.replaceState(null, '', page === 'home' ? location.pathname + location.search : '#' + page);
      window.scrollTo({top:0,behavior:'auto'});
    }
    if (pageTransition) pageTransition.skipTransition();
    if (!reduceMotion && document.startViewTransition) {
      document.documentElement.dataset.pageDirection = page === 'audit' ? 'in' : previous === 'audit' ? 'out' : 'across';
      pageTransition = document.startViewTransition(switchPage);
      pageTransition.finished.catch(function(){});
    } else {
      switchPage();
      var panel=document.getElementById('tab-'+page);
      if (!reduceMotion && panel?.animate) panel.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
    }
  });
});

// Deep links from crawlable service pages open the intended existing workspace.
function openLinkedSection(){
  var page=location.hash.slice(1);
  if (page === 'audit') {
    document.querySelectorAll('.tabpanel').forEach(panel => panel.classList.toggle('active', panel.id === 'tab-audit'));
    document.querySelectorAll('.tab[data-tab]').forEach(button => {
      button.classList.remove('active');
      button.removeAttribute('aria-current');
    });
    currentPage = 'audit';
    return;
  }
  if (['home','services','about','contact'].includes(page)) document.querySelector('.tab[data-tab="'+page+'"]')?.click();
}
openLinkedSection();
window.addEventListener('hashchange',openLinkedSection);

function initOneplaceDemo(){
  var frame = document.getElementById('op2Frame');
  if(!frame) return;
  var navItems = frame.querySelectorAll('.op2-nav[data-page]');
  var pages = frame.querySelectorAll('.op2-page');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0;

  function paint(i){
    navItems.forEach(function(el){
      el.classList.toggle('active', el.dataset.page === String(i));
    });
    pages.forEach(function(p){
      p.classList.toggle('active', p.dataset.idx === String(i));
    });
  }

  paint(0);
  if(reduce) return;

  setInterval(function(){
    idx = (idx + 1) % navItems.length;
    paint(idx);
  }, 2800);
}
initOneplaceDemo();

function initRootlineDemo(){
  var frame = document.getElementById('rlFrame');
  if(!frame) return;
  var navItems = frame.querySelectorAll('.rl-nav[data-rpage]');
  var pages = frame.querySelectorAll('.rl-page');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0;

  function paint(i){
    navItems.forEach(function(el){ el.classList.toggle('active', el.dataset.rpage === String(i)); });
    pages.forEach(function(p){ p.classList.toggle('active', p.dataset.ridx === String(i)); });
  }
  paint(0);
  if(reduce) return;
  setInterval(function(){
    idx = (idx + 1) % navItems.length;
    paint(idx);
  }, 3000);
}
initRootlineDemo();

function initKadenceDemo(){
  var frame = document.getElementById('kdFrame');
  if(!frame) return;
  var navItems = frame.querySelectorAll('.kd-nav[data-kpage]');
  var pages = frame.querySelectorAll('.kd-page');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0;

  function paint(i){
    navItems.forEach(function(el){ el.classList.toggle('active', el.dataset.kpage === String(i)); });
    pages.forEach(function(p){ p.classList.toggle('active', p.dataset.kidx === String(i)); });
  }
  paint(0);
  if(reduce) return;
  setInterval(function(){
    idx = (idx + 1) % navItems.length;
    paint(idx);
  }, 2900);
}
initKadenceDemo();


(function(){
  var form = document.getElementById('contactForm');
  var status = document.getElementById('contactStatus');
  if (!form) return;
  form.addEventListener('submit', async function(event){
    event.preventDefault();
    if (!form.reportValidity()) return;
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = 'Sending…';
    try {
      var response = await fetch('/api/contact', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({...Object.fromEntries(new FormData(form)), analytics:window.TideLineAnalytics?.context(), requestId: form.dataset.requestId || (form.dataset.requestId = crypto.randomUUID())})});
      var result = await response.json();
      if (response.status === 429) throw new Error('rate_limited');
      if (!response.ok || !result.ok) throw new Error('contact_failed');
      if(!result.duplicate&&!form.elements.website?.value)window.TideLineGA4?.conversion('contact');
      form.reset();
      delete form.dataset.requestId;
      if (result.notificationStatus === 'sent') { status.textContent = 'Received. We will review your message and follow up.'; } else { status.innerHTML = 'Your message was saved, but email delivery is pending. If urgent, <a href="mailto:c.knudsen@tidelinestrats.com?cc=q.stewart%40tidelinestrats.com">email Cody directly and copy Quan</a>.'; }
    } catch (error) {
      status.innerHTML = error.message === 'rate_limited' ? 'Too many attempts. Please wait a minute and try again.' : 'The form did not go through. Please <a href="mailto:c.knudsen@tidelinestrats.com?cc=q.stewart%40tidelinestrats.com">email Cody directly and copy Quan</a>.';
    } finally {button.disabled = false;}
  });
})();
