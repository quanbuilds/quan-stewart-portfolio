// Retire the private-test offline shell without deleting saved workspace data.
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.filter(r => new URL(r.scope).pathname === '/loki/').map(r => r.unregister()))).catch(() => {});
const form=document.querySelector('#waitlist-form');
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=form.querySelector('button'),status=document.querySelector('#waitlist-status');
  button.disabled=true;status.textContent='Adding you…';
  try {
    const response=await fetch('/api/loki/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:form.phone.value,analytics:window.TideLineAnalytics?.context(),website:form.website.value,consent:true})});
    const data=await response.json();
    if(!response.ok || !data.ok) throw new Error(response.status===400?'Enter a valid mobile number, including the country code outside the US or Canada.':response.status===429?'Please wait a minute and try again.':'We couldn’t save your number. Please try again.');
    if(!data.duplicate&&!form.website.value)window.TideLineGA4?.conversion('waitlist');
    status.textContent='You’re on the list. We’ll text you when Loki is ready.';
    form.phone.disabled=true;button.textContent='You’re on the list';
  } catch(error) { status.textContent=error.message;button.disabled=false; }
});
