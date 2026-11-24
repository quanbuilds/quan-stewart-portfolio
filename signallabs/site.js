var currentPath = location.pathname.replace(/\/$/, '') || '/';
document.querySelectorAll('.site-navigation .tab[href]').forEach(function(tab) {
  var tabPath = new URL(tab.href).pathname.replace(/\/$/, '') || '/';
  var active = tabPath === currentPath;
  tab.classList.toggle('active', active);
  if (active) tab.setAttribute('aria-current', 'page');
  else tab.removeAttribute('aria-current');
});


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
      if (result.notificationStatus === 'sent') { status.textContent = 'Received. We will review your message and follow up.'; } else { status.textContent = 'Your message was saved. An email notification is still pending.'; }
    } catch (error) {
      status.textContent = error.message === 'rate_limited' ? 'Too many attempts. Please wait a minute and try again.' : 'The form did not go through. Please try again.';
    } finally {button.disabled = false;}
  });
})();
