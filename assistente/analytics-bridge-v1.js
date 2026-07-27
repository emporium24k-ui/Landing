(() => {
  "use strict";

  function send(name, params = {}){
    const payload = {event:name, ...params};
    try{
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
    }catch(_){/* integração opcional */}
    try{
      if(typeof window.gtag === "function") window.gtag("event", name, params);
    }catch(_){/* integração opcional */}
    try{
      if(typeof window.fbq === "function") window.fbq("trackCustom", name, params);
    }catch(_){/* integração opcional */}
    window.dispatchEvent(new CustomEvent("emp24k:analytics", {detail:payload}));
  }

  window.addEventListener("emp24k:intent", (event) => {
    const detail = event.detail || {};
    send("assistant_intent", {
      intent: detail.intent || "unknown",
      product: detail.entities?.product || "",
      material: detail.entities?.material || "",
      model: detail.entities?.model || ""
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("a,button");
    if(!target) return;
    const href = String(target.href || "");
    if(target.id === "topCta" || /api\.whatsapp\.com|wa\.me/.test(href)){
      send("assistant_whatsapp_click", {label:String(target.textContent || "").trim().slice(0,80)});
      return;
    }
    if(/emporium24k\.com\.br/.test(href)){
      send("assistant_store_click", {label:String(target.textContent || "").trim().slice(0,80), url:href.slice(0,240)});
    }
    if(target.dataset?.ringModel){
      send("assistant_alliance_model", {model:target.dataset.ringModel});
    }
  }, true);

  window.__analyticsBridgeV1 = Object.freeze({send});
})();