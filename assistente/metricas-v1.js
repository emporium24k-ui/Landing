(() => {
  "use strict";

  const KEY = "emp24kAssistantMetricsV1";
  const empty = () => ({
    sessions: 0,
    messages: 0,
    unknown: 0,
    whatsappClicks: 0,
    storeClicks: 0,
    allianceModelClicks: 0,
    intents: {},
    firstSeenAt: Date.now(),
    updatedAt: Date.now()
  });

  function read(){
    try{
      const value = JSON.parse(localStorage.getItem(KEY) || "null");
      return value && typeof value === "object" ? {...empty(), ...value, intents:{...(value.intents || {})}} : empty();
    }catch(_){ return empty(); }
  }

  const metrics = read();
  try{
    if(!sessionStorage.getItem("emp24kMetricsSession")){
      sessionStorage.setItem("emp24kMetricsSession", "1");
      metrics.sessions += 1;
    }
  }catch(_){ /* armazenamento opcional */ }

  function save(){
    metrics.updatedAt = Date.now();
    try{ localStorage.setItem(KEY, JSON.stringify(metrics)); }catch(_){ /* armazenamento opcional */ }
  }

  function countIntent(intent){
    const key = String(intent || "unknown");
    metrics.messages += 1;
    metrics.intents[key] = (metrics.intents[key] || 0) + 1;
    if(key === "unknown") metrics.unknown += 1;
    save();
  }

  window.addEventListener("emp24k:intent", (event) => countIntent(event.detail?.intent));

  document.addEventListener("click", (event) => {
    const target = event.target.closest("a,button");
    if(!target) return;
    const href = String(target.href || "");
    if(/api\.whatsapp\.com|wa\.me/.test(href) || target.id === "topCta") metrics.whatsappClicks += 1;
    if(/emporium24k\.com\.br/.test(href)) metrics.storeClicks += 1;
    if(target.dataset?.ringModel) metrics.allianceModelClicks += 1;
    save();
  }, true);

  function summary(){
    const known = Math.max(0, metrics.messages - metrics.unknown);
    return {
      ...metrics,
      understoodRate: metrics.messages ? Number(((known / metrics.messages) * 100).toFixed(1)) : 0,
      unknownRate: metrics.messages ? Number(((metrics.unknown / metrics.messages) * 100).toFixed(1)) : 0
    };
  }

  function reset(){
    const fresh = empty();
    Object.keys(metrics).forEach((key) => delete metrics[key]);
    Object.assign(metrics, fresh);
    save();
    return summary();
  }

  window.__metricasAssistenteV1 = Object.freeze({summary, reset, key:KEY});
  save();
})();
