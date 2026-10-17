(function(root){
  function clean(value){
    return String(value || '')
      .replace(/([.!?])["'’”\s,;:|—-]*(?:(?:topic|label|category)\s*:\s*)?(?:arrival|handoff|tools|confirmation|scheduling|frequency|ownership|intake|follow[- ]?up)["'’”\s.]*$/i,'$1')
      .replace(/\s*[\[({](?:topic|label|category)\s*:[^\])}]+[\])}]\s*$/i,'').trim();
  }
  root.LokiText={clean:clean};
  if(typeof module==='object' && module.exports) module.exports=root.LokiText;
})(typeof globalThis!=='undefined'?globalThis:this);
