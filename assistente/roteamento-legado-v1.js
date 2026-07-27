(() => {
  "use strict";

  const core = window.__coreIntencoesV1;
  const config = window.__EMP24K_CONFIG__;
  if(!core || !config) return;

  const state = {
    awaitingCustomDetails: false,
    original: "",
    expiresAt: 0,
    busy: false
  };

  const CUSTOM_TERMS = [
    "personalizado", "personalizada", "personalizados", "personalizadas", "sob medida",
    "do meu jeito", "modelo exclusivo", "projeto exclusivo", "igual a foto", "a partir de uma foto",
    "a partir de um desenho", "tenho uma ideia", "quero criar", "quero desenvolver"
  ];

  const EXPLICIT_CUSTOM_TERMS = [
    "personalizado", "personalizada", "personalizados", "personalizadas", "sob medida",
    "do meu jeito", "modelo exclusivo", "projeto exclusivo", "igual a foto", "a partir de uma foto",
    "a partir de um desenho", "tenho uma ideia"
  ];

  const ALLIANCE_TERMS = ["alianca", "aliancas", "aliansa", "aliansas", "alinca", "alincas"];
  const CHANGE_SUBJECT = [
    "rastreio", "rastreamento", "frete", "sedex", "pagamento", "pix", "cartao", "boleto",
    "conserto", "polimento", "vender ouro", "vender prata", "avaliar ouro", "avaliar prata", "endereco"
  ];

  const normalize = (value) => core.normalize(value);
  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function isAlliance(text){
    return includesAny(text, ALLIANCE_TERMS);
  }

  function isCustomJewelry(text){
    if(isAlliance(text)) return false;
    const hasCustom = includesAny(text, CUSTOM_TERMS);
    const explicitCustom = includesAny(text, EXPLICIT_CUSTOM_TERMS);
    const hasPiece = /\b(joia|joias|peca|pecas|anel|aneis|solitario|aparador|pingente|corrente|colar|pulseira|brinco|tornozeleira)\b/.test(text);
    return hasCustom && (hasPiece || explicitCustom);
  }

  function enoughDetails(text){
    if(!text || text.length < 10) return false;
    if(/^(sim|nao|ainda nao|nao sei|talvez|isso|exato)$/.test(text)) return false;
    return /\b(ouro|prata|mm|cm|aro|pedra|diamante|zirconia|safira|rubi|esmeralda|ametista|nome|iniciais|foto|desenho|modelo|fosco|polido|tamanho|largura|corrente|colar|pulseira|pingente|brinco|anel)\b/.test(text) || text.length >= 24;
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  }

  function addMessage(html, who = "bot"){
    const messages = document.querySelector("#messages");
    const intro = document.querySelector("#intro");
    if(!messages) return;
    if(intro) intro.style.display = "none";
    const row = document.createElement("div");
    row.className = `row ${who === "user" ? "user" : ""}`;
    if(who !== "user"){
      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = "♛";
      row.appendChild(avatar);
    }
    const stack = document.createElement("div");
    const bubble = document.createElement("div");
    const meta = document.createElement("div");
    stack.className = "message-stack";
    bubble.className = "bubble";
    meta.className = "bubble-meta";
    bubble.innerHTML = html;
    meta.textContent = who === "user" ? clock() : `Coroa 24K · ${clock()}`;
    stack.append(bubble, meta);
    row.appendChild(stack);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function whatsappUrl(details){
    const text = [
      "Olá! Vim pelo assistente Coroa 24K e quero criar uma joia personalizada.",
      `Pedido inicial: ${state.original}`,
      `Detalhes: ${details}`,
      "Caso eu tenha uma foto ou desenho, vou anexar nesta conversa."
    ].join("\n");
    return `https://api.whatsapp.com/send/?phone=${config.contacts.boss}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
  }

  function addWhatsAppButton(details){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    link.className = "action-btn wa";
    link.href = whatsappUrl(details);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Enviar projeto pelo WhatsApp";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function searchUrl(raw){
    const route = window.__rotaProdutosSiteV1;
    const classified = route?.classify?.(route.normalize(raw));
    if(classified?.query && route.searchUrl) return route.searchUrl(classified.query);
    return `${config.store.search}${encodeURIComponent(raw)}`;
  }

  function addSearchButton(raw){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    link.className = "action-btn store";
    link.href = searchUrl(raw);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Ver resultados no site";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answerCustomStart(raw){
    if(state.busy) return;
    state.busy = true;
    state.awaitingCustomDetails = true;
    state.original = raw;
    state.expiresAt = Date.now() + 30 * 60 * 1000;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 220));
    addMessage("Fazemos joias personalizadas em ouro 18k e prata 925. Me conte qual peça deseja, o material, as medidas e os detalhes do modelo. Caso tenha foto ou desenho de referência, ela será anexada depois no WhatsApp.");
    state.busy = false;
    input?.focus();
  }

  async function answerCustomDetails(raw, text){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 220));
    if(!enoughDetails(text)){
      addMessage("Sem problema. Para eu organizar o pedido, me diga pelo menos o tipo de peça e algum detalhe que imagina, como material, tamanho, pedra, iniciais ou estilo.");
      state.expiresAt = Date.now() + 30 * 60 * 1000;
    }else{
      addMessage(`Entendi o projeto: <strong>${escapeHtml(raw)}</strong>. A foto ou o desenho, caso exista, deve ser anexado no WhatsApp para a equipe visualizar. Agora o atendimento consegue analisar a produção e calcular o valor.`);
      addWhatsAppButton(raw);
      state.awaitingCustomDetails = false;
      state.expiresAt = 0;
    }
    state.busy = false;
    input?.focus();
  }

  async function answerProductFallback(raw){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 200));
    addMessage("Não encontrei um cartão exato para esse pedido no catálogo sincronizado. Vou abrir a pesquisa da loja com os termos que você informou, para você ver somente as opções relacionadas.");
    addSearchButton(raw);
    state.busy = false;
    input?.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const text = normalize(raw);
      if(!text) return;

      if(state.awaitingCustomDetails){
        if(Date.now() > state.expiresAt || includesAny(text, CHANGE_SUBJECT)){
          state.awaitingCustomDetails = false;
          state.expiresAt = 0;
          if(includesAny(text, CHANGE_SUBJECT)) return;
        }else{
          event.preventDefault();
          event.stopImmediatePropagation();
          answerCustomDetails(raw, text);
          return;
        }
      }

      if(isCustomJewelry(text)){
        event.preventDefault();
        event.stopImmediatePropagation();
        answerCustomStart(raw);
        return;
      }

      const result = core.classify(raw, window.__coordenadorCentralV1?.state || {});
      const readyProduct = result.intent === "ready_product_search" && result.entities?.product !== "alianca";
      if(!readyProduct) return;
      const visualProducts = window.__catalogoLojaVisualV1?.findProducts?.(raw, result) || [];
      if(visualProducts.length) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      answerProductFallback(raw);
    }, true);
  });

  window.__roteamentoLegadoV1 = Object.freeze({state, isCustomJewelry, enoughDetails, searchUrl});
})();