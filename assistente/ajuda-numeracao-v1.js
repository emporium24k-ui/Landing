(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const VIDEO_WITHOUT_RING = "./media/como-medir-sem-anel.mp4";
  const VIDEO_WITH_RING = "./media/como-medir-com-anel.mp4";

  const state = {
    active: false,
    step: null,
    bypassOnce: false,
    originStage: null
  };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, terms) => terms.some((term) => text.includes(term));

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
  }

  function messages(){
    return document.querySelector("#messages");
  }

  function addMessage(html, who = "bot"){
    const container = messages();
    const intro = document.querySelector("#intro");
    if(!container) return;
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
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  }

  function addChoices(options){
    const container = messages();
    if(!container) return;
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    card.dataset.sizeHelpCard = "1";
    card.style.display = "grid";
    card.style.gap = "8px";

    options.forEach((option) => {
      const element = document.createElement(option.href ? "a" : "button");
      element.className = `action-btn ${option.kind === "store" ? "store" : "wa"}`;
      element.textContent = option.label;
      if(option.href){
        element.href = option.href;
        element.target = "_blank";
        element.rel = "noopener noreferrer";
      }else{
        element.type = "button";
      }
      Object.entries(option.data || {}).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
      card.appendChild(element);
    });

    container.appendChild(card);
    container.scrollTop = container.scrollHeight;
  }

  function clearHelpCards(){
    document.querySelectorAll('[data-size-help-card="1"]').forEach((node) => node.remove());
  }

  function alliancePhone(){
    const routed = window.__EMP24K_ROUTING__?.alliancePhone?.();
    if(SALES.includes(routed)) return routed;
    try{
      const saved = sessionStorage.getItem("coroa24kSalesPhone");
      if(SALES.includes(saved)) return saved;
    }catch(_){/* sem storage */}
    return SALES[0];
  }

  function sellerUrl(){
    const phone = alliancePhone();
    const text = "Olá! Vim pela Coroa 24K e preciso de ajuda para descobrir a numeração correta dos meus aros.";
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
  }

  function isSizeDiscoveryQuestion(text){
    if(!text || text.length > 260) return false;

    const direct = includesAny(text, [
      "como descubro minha numeracao", "como descubro a minha numeracao",
      "como descubro minhas numeracoes", "como descobrir minha numeracao",
      "como descobrir minhas numeracoes", "como saber minha numeracao",
      "como saber minhas numeracoes", "como descubro o aro", "como descobrir o aro",
      "como saber o aro", "como descubro meu aro", "como saber meu aro",
      "como medir o aro", "como medir meu aro", "como medir o dedo",
      "como meco o dedo", "como medir meus dedos", "como saber o tamanho do dedo",
      "como descobrir o tamanho do dedo", "como descobrir o tamanho do anel",
      "como saber o tamanho do anel", "como medir o tamanho do anel",
      "qual meu tamanho de anel", "qual o meu tamanho de anel",
      "qual minha numeracao de anel", "qual a minha numeracao de anel",
      "nao sei meu aro", "nao sei o meu aro", "nao sei os aros",
      "nao sei a numeracao", "nao sei as numeracoes", "nao sei meu tamanho de anel"
    ]);
    if(direct) return true;

    const discovery = /\b(como|descobrir|descubro|saber|medir|meco|medida|qual)\b/.test(text);
    const size = /\b(aro|aros|numeracao|numeracoes|numero|tamanho|medida)\b/.test(text);
    const ringOrFinger = /\b(anel|aneis|alianca|aliancas|dedo|dedos)\b/.test(text);
    return discovery && size && ringOrFinger;
  }

  function start(raw, options = {}){
    clearHelpCards();
    state.active = true;
    state.step = "method";
    state.originStage = window.__catalogoConversaV2?.flow?.stage || null;

    if(!options.fromButton) addMessage(escapeHtml(raw), "user");
    else addMessage("Ainda não sei os aros", "user");

    addMessage("Sem problema! Posso te ajudar a descobrir a numeração correta. Você prefere <strong>receber ajuda direta de um vendedor</strong> ou <strong>fazer a medição sozinho(a)</strong>?");
    addChoices([
      {label:"Quero ajuda de um vendedor", href:sellerUrl()},
      {label:"Quero descobrir sozinho(a)", data:{sizeHelpAction:"self"}, kind:"store"}
    ]);
  }

  function askHasRing(){
    clearHelpCards();
    state.active = true;
    state.step = "has_ring";
    addMessage("Perfeito. Você tem <strong>um anel que já sirva corretamente</strong> no dedo que deseja medir?");
    addChoices([
      {label:"Tenho um anel que serve", data:{sizeHelpAction:"with-ring"}, kind:"store"},
      {label:"Não tenho um anel", data:{sizeHelpAction:"without-ring"}, kind:"store"}
    ]);
  }

  function addVideo(src, title){
    const container = messages();
    if(!container) return;

    const card = document.createElement("div");
    card.className = "action-card compact-card";
    card.dataset.sizeHelpCard = "1";
    card.style.display = "grid";
    card.style.gap = "10px";
    card.style.padding = "12px";

    const label = document.createElement("div");
    label.style.color = "#f5df98";
    label.style.fontWeight = "700";
    label.textContent = title;

    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = src;
    video.style.width = "100%";
    video.style.maxHeight = "420px";
    video.style.borderRadius = "14px";
    video.style.background = "#000";
    video.dataset.sizeHelpVideo = "1";

    card.append(label, video);
    container.appendChild(card);
    container.scrollTop = container.scrollHeight;
  }

  function showTutorial(hasRing){
    clearHelpCards();
    state.active = false;
    state.step = null;

    if(hasRing){
      addMessage("Ótimo! Como você já tem um anel que serve, siga este vídeo para descobrir a numeração:");
      addVideo(VIDEO_WITH_RING, "Vídeo — descobrir a numeração usando um anel");
    }else{
      addMessage("Sem problema! Como você não tem um anel de referência, siga este vídeo para medir diretamente o dedo:");
      addVideo(VIDEO_WITHOUT_RING, "Vídeo — descobrir a numeração sem ter um anel");
    }

    addChoices([
      {label:"Já descobri minha numeração", data:{sizeHelpAction:"return"}, kind:"store"},
      {label:"Ainda preciso de ajuda do vendedor", href:sellerUrl()}
    ]);
  }

  function returnToSizes(){
    clearHelpCards();
    state.active = false;
    state.step = null;
    const current = window.__catalogoConversaV2?.flow;
    if(current?.selected){
      current.stage = "sizes";
      addMessage("Perfeito. Agora me diga as <strong>numerações dos dois aros</strong> e seguimos de onde paramos.");
    }else{
      addMessage("Perfeito. Quando tiver a numeração, é só me informar os aros que você encontrou.");
    }
    document.querySelector("#question")?.focus();
  }

  function processSubmit(event){
    const form = event.target.closest?.("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    if(state.bypassOnce){
      state.bypassOnce = false;
      return;
    }

    const raw = String(input.value || "").trim();
    if(!raw) return;
    const text = normalize(raw);

    if(isSizeDiscoveryQuestion(text)){
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      start(raw);
      input.focus();
    }
  }

  function processClick(event){
    const target = event.target.closest?.("button");
    if(!target) return;

    if(target.dataset.conversationUnknownSizes === "1"){
      event.preventDefault();
      event.stopImmediatePropagation();
      start("Ainda não sei os aros", {fromButton:true});
      return;
    }

    const action = target.dataset.sizeHelpAction;
    if(!action) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if(action === "self"){
      addMessage("Quero descobrir sozinho(a)", "user");
      askHasRing();
    }else if(action === "with-ring"){
      addMessage("Tenho um anel que serve", "user");
      showTutorial(true);
    }else if(action === "without-ring"){
      addMessage("Não tenho um anel", "user");
      showTutorial(false);
    }else if(action === "return"){
      addMessage("Já descobri minha numeração", "user");
      returnToSizes();
    }
  }

  // Os listeners são registrados imediatamente e em captura para que pedidos de ajuda
  // com numeração tenham prioridade sobre a etapa de aros do catálogo.
  document.addEventListener("submit", processSubmit, true);
  document.addEventListener("click", processClick, true);

  window.__ajudaNumeracaoV1 = Object.freeze({
    state,
    normalize,
    isSizeDiscoveryQuestion,
    start,
    askHasRing,
    showTutorial,
    returnToSizes,
    sellerUrl
  });
})();
