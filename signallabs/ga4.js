/* TideLine GA4. Public pages only; no form values, hashes, query strings or CRM identifiers. */
(()=>{
  if(!['tidelinestrats.com','www.tidelinestrats.com'].includes(location.hostname)||navigator.globalPrivacyControl||navigator.doNotTrack==='1')return;
  const measurement='G-LCY7Q7N774';
  window.dataLayer=window.dataLayer||[];
  const gtag=function(){window.dataLayer.push(arguments);};
  gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
  gtag('js',new Date());
  const publicPaths=['/','/loki/','/services/','/faq/','/services/workflow-automation/','/services/operations-consulting/','/services/custom-software/'];
  if(!publicPaths.includes(location.pathname))return;
  const path=location.pathname;
  let referrer='';try{referrer=new URL(document.referrer).origin;}catch{}
  const config={send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+path,page_referrer:referrer,page_title:path==='/loki/'?'Loki waitlist':'TideLine Strategies'};
  const query=new URLSearchParams(location.search),source=query.get('utm_source'),medium=query.get('utm_medium');
  if(['linkedin','tiktok','instagram','facebook','youtube','google','bing','newsletter'].includes(source))config.campaign_source=source;
  if(['social','organic','paid_social','cpc','email','referral'].includes(medium))config.campaign_medium=medium;
  gtag('config',measurement,config);
  gtag('event','page_view',config);
  document.addEventListener('click',event=>{const target=event.target.closest('[data-tab],#heroStartCta');if(!target)return;const section=target.id==='heroStartCta'?'audit':target.dataset.tab;if(['home','audit','services','about','contact'].includes(section))gtag('event','section_view',{...config,section});});
  let converted=new Set();
  window.TideLineGA4={conversion(kind){if(!['contact','waitlist'].includes(kind)||converted.has(kind))return;converted.add(kind);gtag('event',kind==='contact'?'generate_lead':'sign_up',{...config,lead_type:kind==='contact'?'website_inquiry':'loki_waitlist',method:'website'});}};
  const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+measurement;document.head.append(script);
})();
