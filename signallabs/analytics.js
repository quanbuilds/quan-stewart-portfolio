/* Anonymous first-party navigation counts. Never reads form fields or access keys. */
(()=>{
  if(navigator.globalPrivacyControl||navigator.doNotTrack==='1')return;
  let session;
  try{session=sessionStorage.getItem('tideline-visit-v1')||crypto.randomUUID();sessionStorage.setItem('tideline-visit-v1',session);}catch{return;}
  const app=location.pathname.startsWith('/loki/');
  const device=innerWidth<700?'phone':innerWidth<1050?'tablet':'desktop';
  const track=(kind,page)=>{
    let referrer='';try{referrer=new URL(document.referrer).origin;}catch{}
    const body=JSON.stringify({id:crypto.randomUUID(),session,kind,page,device,referrer});
    try{
      if(navigator.sendBeacon&&navigator.sendBeacon('/api/analytics/events',new Blob([body],{type:'application/json'})))return;
      fetch('/api/analytics/events',{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true}).catch(()=>{});
    }catch{}
  };
  track('page_view',app?'app':'home');if(app)track('app_open','app');
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-tab],#heroStartCta');if(!button)return;
    const page=button.id==='heroStartCta'?'audit':button.dataset.tab;
    if(!['home','audit','services','about','contact'].includes(page))return;
    track(page==='audit'?'audit_open':page==='contact'?'contact_open':'section_view',page);
  });
})();
