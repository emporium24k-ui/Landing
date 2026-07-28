(() => {
  "use strict";

  const config = window.__EMP24K_CONFIG__;
  if(!config) return;

  const SALES = [...(config.contacts?.allianceSales || [])];
  const SPECIALIST = config.contacts?.services || config.contacts?.boss || "5541998518452";
  const VISITOR_KEY = "emp24kVisitorRoutingIdV1";
  const AGENT_KEY = "emp24kAllianceSalesAgentV1";
  const LEGACY_SESSION_KEY = "coroa24kSalesPhone";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function makeVisitorId(){
    try{
      const existing = localStorage.getItem(VISITOR_KEY);
      if(existing) return existing;
      const created = typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}-${navigator.userAgent}`;
      localStorage.setItem(VISITOR_KEY, created);
      return created;
    }catch(_){
      return `${Date.now()}-${Math.random()}-${navigator.userAgent}`;
    }
  }

  function hash(value){
    let result = 2166136261;
    for(const char of String(value || "")){
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function alliancePhone(){
    if(!SALES.length) return SPECIALIST;
    try{
      const saved = localStorage.getItem(AGENT_KEY);
      if(SALES.includes(saved)){
        sessionStorage.setItem(LEGACY_SESSION_KEY, saved);
        return saved;
      }
      const selected = SALES[hash(makeVisitorId()) % SALES.length];
      localStorage.setItem(AGENT_KEY, selected);
      sessionStorage.setItem(LEGACY_SESSION_KEY, selected);
      return selected;
    }catch(_){
      const selected = SALES[hash(makeVisitorId()) % SALES.length];
      try{ sessionStorage.setItem(LEGACY_SESSION_KEY, selected); }catch(__){/* armazenamento indisponível */}
      return selected;
    }
  }

  function isPersonalized(text){
    return /\b(personalizad[oa]s?|personalizar|sob medida|projeto exclusivo|projeto personalizado|peca exclusiva|joia exclusiva|molde 3d)\b/.test(text) ||
      text.includes("enviar projeto pelo whatsapp") ||
      text.includes("enviar ideia ao atendimento") ||
      text.includes("foto ou desenho de referencia para uma peca");
  }

  function isRepair(text){
    return /\b(conserto|consertar|reparo|reparar|arrumar|solda|soldar|polimento|polir|restaurar)\b/.test(text) ||
      /\b(ajuste|ajustar|aumentar|diminuir|reduzir|alargar|apertar|redimensionar)\b.*\b(aro|alianca|anel)\b/.test(text) ||
      /\b(aro|alianca|anel)\b.*\b(ajuste|ajustar|aumentar|diminuir|reduzir|alargar|apertar|redimensionar)\b/.test(text) ||
      text.includes("pedra caiu");
  }

  function isMetalsEvaluation(text){
    const material = /\b(ouro|prata|joia|joias|peca|pecas)\b/.test(text);
    const saleOrEvaluation = /\b(vender|vendo|avaliar|avaliacao|quanto pagam|compramos|compram)\b/.test(text);
    const customerGold = text.includes("meu ouro") || text.includes("ouro do cliente") ||
      text.includes("proprio ouro") || text.includes("abater no valor") ||
      text.includes("parte do pagamento") || text.includes("ouro como entrada") ||
      text.includes("avaliar ouro e alianca") || text.includes("ouro para fabricacao") ||
      text.includes("somente a mao de obra") || text.includes("so a mao de obra");
    return (material && saleOrEvaluation) || customerGold;
  }

  function routeForText(value){
    const text = normalize(value);
    if(isPersonalized(text) || isRepair(text) || isMetalsEvaluation(text)) return SPECIALIST;
    return alliancePhone();
  }

  function rewriteWhatsAppLink(link){
    if(!(link instanceof HTMLAnchorElement) || !link.href.includes("api.whatsapp.com/send")) return;
    try{
      const url = new URL(link.href);
      const context = `${url.searchParams.get("text") || ""} ${link.textContent || ""}`;
      url.searchParams.set("phone", routeForText(context));
      link.href = url.toString();
      link.dataset.emp24kRouted = "1";
    }catch(_){/* link externo inválido */}
  }

  function scan(root = document){
    if(root.matches?.('a[href*="api.whatsapp.com/send"]')) rewriteWhatsAppLink(root);
    root.querySelectorAll?.('a[href*="api.whatsapp.com/send"]').forEach(rewriteWhatsAppLink);
  }

  function boot(){
    alliancePhone();
    scan(document);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if(node instanceof HTMLElement) scan(node);
      });
    }));
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();

  window.__EMP24K_ROUTING__ = Object.freeze({
    alliancePhone,
    specialistPhone: () => SPECIALIST,
    routeForText,
    rewriteWhatsAppLink,
    normalize,
    mode: "stable-50-50"
  });
})();