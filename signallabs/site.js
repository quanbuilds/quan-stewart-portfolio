
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

function updateShip(){
  var voyage = document.querySelector('.voyage');
  var stage = document.querySelector('.voyage-stage');
  var shipEl = document.getElementById('voyageShip');
  if(!voyage || !stage || !shipEl) return;
  if(reduceMotion){
    shipEl.style.transform = 'translateX(' + ((stage.clientWidth - shipEl.offsetWidth) / 2) + 'px)';
    return;
  }
  var rect = voyage.getBoundingClientRect();
  var vh = window.innerHeight;
  var totalDist = vh + rect.height;
  var scrolled = vh - rect.top;
  var progress = totalDist > 0 ? scrolled / totalDist : 0;
  progress = Math.max(0, Math.min(1, progress));
  var maxX = Math.max(0, stage.clientWidth - shipEl.offsetWidth - 40);
  shipEl.style.transform = 'translateX(' + (progress * maxX) + 'px)';
}
window.addEventListener('scroll', function(){ requestAnimationFrame(updateShip); }, {passive:true});
window.addEventListener('resize', updateShip);
updateShip();

document.querySelectorAll('.tab').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.tab').forEach(function(b){ b.classList.remove('active'); });
    document.querySelectorAll('.tabpanel').forEach(function(p){ p.classList.remove('active'); });
    btn.classList.add('active');
    var panel = document.getElementById('tab-' + btn.dataset.tab);
    if(panel){ panel.classList.add('active'); }
    window.scrollTo({top:0, behavior:'auto'});
    requestAnimationFrame(updateShip);
  });
});

var partnershipCta = document.querySelector('.cta-secondary');
if(partnershipCta){partnershipCta.addEventListener('click',function(e){e.preventDefault();document.querySelector('.tab[data-tab="services"]')?.click();});}
var heroStartCta = document.getElementById('heroStartCta');
if(heroStartCta){
  heroStartCta.addEventListener('click', function(e){
    e.preventDefault();
    var contactTabBtn = document.querySelector('.tab[data-tab="contact"]');
    if(contactTabBtn){ contactTabBtn.click(); }
  });
}
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
      var response = await fetch('/api/contact', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({...Object.fromEntries(new FormData(form)), requestId: form.dataset.requestId || (form.dataset.requestId = crypto.randomUUID())})});
      var result = await response.json();
      if (response.status === 429) throw new Error('rate_limited');
      if (!response.ok || !result.ok) throw new Error('contact_failed');
      form.reset();
      delete form.dataset.requestId;
      if (result.notificationStatus === 'sent') { status.textContent = 'Received. We will review your message and follow up.'; } else { status.innerHTML = 'Your message was saved, but email delivery is pending. If urgent, <a href="mailto:c.knudsen@tidelinestrats.com">email Cody directly</a>.'; }
    } catch (error) {
      status.textContent = error.message === 'rate_limited' ? 'Too many attempts. Please wait a minute and try again.' : 'The form did not go through. Please email c.knudsen@tidelinestrats.com directly.';
    } finally {button.disabled = false;}
  });
})();
