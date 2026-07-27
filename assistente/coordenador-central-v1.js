(() => {
  "use strict";

  const core = window.__coreIntencoesV1;
  const config = window.__EMP24K_CONFIG__;
  if(!core || !config) return;

  const STORAGE_KEY = "emp24kAssistantStateV1";
  const state = {
    intent: null,
    material: null,
    product: null,
    model: null,
    stage: null,
    lastUserMessage: "",
    messages: 0,
    history: []
  };

  try{
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    if(saved && typeof saved === "object") Object.assign(state, saved, {history:Array.isArray(saved.history) ? saved.history.slice(-12) : []});
  }catch(_){ /* sessão nova */ }

  function save(){
    try{ sessionStorage.setItem(STORAGE_KEY, JSON.stringify({...state, history:state.history.slice(-12)})); }catch(_){ /* armazenamento opcional */ }
  }

  function updateFromResult(result, raw){
    state.intent = result.intent;
    state.lastUserMessage = String(raw || "").trim();
    state.messages += 1;
    if(result.entities?.material) state.material = result.entities.material;
    if(result.entities?.product) state.product = result.entities.product;
    if(result.entities?.model) state.model = result.entities.model;

    const stageByIntent = {
      alliance_interest:"escolhendo material",
      alliance_catalog:"vendo modelos",
      alliance_custom:"descrevendo personalizada",
      customer_gold_alliance:"avaliando ouro do cliente",
      ring_resize:"ajuste de aro",
      ready_product_search:"pesquisando produto",
      sell_metals:"avaliação para venda",
      repair_service:"serviço ou conserto",
      tracking:"rastreamento",
      payment:"formas de pagamento",
      shipping:"frete e envio"
    };
    state.stage = stageByIntent[result.intent] || state.stage;
    state.history.push({intent:result.intent, message:state.lastUserMessage, at:Date.now()});
    state.history = state.history.slice(-12);
    save();
    window.dispatchEvent(new CustomEvent("emp24k:intent", {detail:{...result, raw:state.lastUserMessage, state:{...state}}}));
  }

  function setFromButton(button){
    if(button.dataset.ringCatalog){
      state.intent = "alliance_catalog";
      state.material = button.dataset.ringCatalog === "silver" ? "prata 925" : "ouro 18k";
      state.product = "alianca";
      state.stage = "vendo modelos";
    }
    if(button.dataset.ringModel){
      const model = window.__catalogoAliancasV1?.CATALOG
        ? [...window.__catalogoAliancasV1.CATALOG.gold, ...window.__catalogoAliancasV1.CATALOG.silver].find((item) => item.id === button.dataset.ringModel)
        : null;
      state.intent = "alliance_catalog";
      state.product = "alianca";
      state.model = model?.name || button.dataset.ringModel;
      state.material = model?.material || state.material;
      state.stage = "modelo escolhido";
    }
    if(button.dataset.personalizedMaterial){
      state.intent = "alliance_custom";
      state.product = "alianca";
      state.material = button.dataset.personalizedMaterial === "silver" ? "prata 925" : button.dataset.personalizedMaterial === "gold" ? "ouro 18k" : state.material;
      state.stage = "descrevendo personalizada";
    }
    save();
  }

  function contextLabel(intent){
    return ({
      alliance_interest:"interesse em alianças",
      alliance_catalog:"alianças e modelos",
      alliance_custom:"aliança personalizada",
      customer_gold_alliance:"aliança com ouro do cliente",
      ring_resize:"ajuste de aro",
      ready_product_search:"joia ou semijoia pronta",
      sell_metals:"venda ou avaliação de ouro/prata",
      repair_service:"conserto ou polimento",
      tracking:"rastreamento de pedido",
      payment:"formas de pagamento",
      shipping:"frete e envio",
      trust:"segurança e documentos",
      location:"endereço",
      material_education:"dúvida sobre materiais",
      engraving:"gravação interna"
    })[intent] || "atendimento geral";
  }

  function buildSummary(){
    const parts = [`Olá! Vim pelo assistente Coroa 24K e preciso de ajuda com ${contextLabel(state.intent)}.`];
    if(state.product) parts.push(`Produto: ${state.product}.`);
    if(state.material) parts.push(`Material: ${state.material}.`);
    if(state.model) parts.push(`Modelo: ${state.model}.`);
    if(state.stage) parts.push(`Etapa: ${state.stage}.`);
    if(state.lastUserMessage) parts.push(`Última mensagem: “${state.lastUserMessage.slice(0, 180)}”.`);
    return parts.join(" ");
  }

  function rewritePolicy(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user") || bubble.dataset.centralPolicy === "1") return;
    const plain = core.normalize(bubble.textContent);
    if(!plain) return;
    let replacement = null;

    if(plain.includes("nao produzimos em ouro 10k ou 14k") || plain.includes("trabalhamos somente com ouro 18k") && state.product === "alianca"){
      replacement = "Para alianças, trabalhamos com <strong>ouro 10k e ouro 18k</strong>. O ouro 14k ainda não está disponível, e não fazemos em ouro 24k porque ele é macio demais para o uso diário.";
    }

    if(!replacement && /gravacao|gravar|nome dentro|frase dentro/.test(plain) && (plain.includes("gratuita") || plain.includes("incluida") || plain.includes("sem custo")) && !plain.includes("15 caracteres")){
      replacement = "A gravação é feita somente na parte interna das alianças, sem custo, com limite máximo de <strong>15 caracteres</strong>. Acima disso o texto não cabe na aliança.";
    }

    if(!replacement && state.material === "prata 925" && state.product === "alianca" && (plain.includes("frete gratis") || plain.includes("frete gratuito") || plain.includes("sem custo de frete"))){
      replacement = "Nas <strong>alianças de prata 925</strong>, o frete não é grátis. O valor do envio é calculado conforme o CEP.";
    }

    if(!replacement && state.material === "prata 925" && state.product === "alianca" && (plain.includes("promocao") || plain.includes("promocoes"))){
      replacement = plain.includes("modelos de prata 925")
        ? "Estes são modelos de <strong>prata 925</strong> com valores de referência do catálogo atual. As alianças acompanham gravação interna de até 15 caracteres, garantia eterna do teor e caixinha. O frete é calculado conforme o CEP."
        : "Os valores das alianças de prata são os apresentados no catálogo. Posso mostrar os modelos disponíveis.";
    }

    if(!replacement && (plain.includes("envie a referencia") || plain.includes("pode enviar a referencia") || plain.includes("envie a foto") || plain.includes("pode enviar a foto")) && !plain.includes("whatsapp")){
      replacement = "Pode me contar a ideia por texto. Caso tenha uma foto, desenho ou print de referência, o arquivo deve ser anexado no WhatsApp para conseguirmos visualizar e analisar.";
    }

    if(!replacement && state.intent === "ring_resize" && (plain.includes("quando e tecnicamente possivel") || plain.includes("quando for possivel"))){
      replacement = "Fazemos o aumento ou a diminuição do aro. Caso você não saiba quantos números precisa ajustar, o atendente ajuda a descobrir a medida correta.";
    }

    if(replacement) bubble.innerHTML = replacement;
    bubble.dataset.centralPolicy = "1";
  }

  function scan(root = document){
    if(root.matches?.(".row:not(.user) .bubble")) rewritePolicy(root);
    root.querySelectorAll?.("#messages .row:not(.user) .bubble").forEach(rewritePolicy);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    const messages = document.querySelector("#messages");
    if(!form || !input || !messages) return;

    form.addEventListener("submit", () => {
      const raw = String(input.value || "").trim();
      if(!raw) return;
      const result = core.classify(raw, state);
      updateFromResult(result, raw);
    }, true);

    messages.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if(button) setFromButton(button);
    }, true);

    scan(document);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if(node instanceof HTMLElement) scan(node);
    })));
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__coordenadorCentralV1 = Object.freeze({state, buildSummary, classify:core.classify, save});
})();
