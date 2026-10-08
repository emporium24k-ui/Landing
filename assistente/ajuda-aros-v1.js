(() => {
  "use strict";

  const state = { mode: null };
  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const flow = () => window.__catalogoConversaV2?.flow || null;

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
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

  function addChoices(options){
    const messages = document.querySelector("#messages");
    if(!messages) return;
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
      Object.entries(option.data || {}).forEach(([key, value]) => element.dataset[key] = value);
      card.appendChild(element);
    });
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeHelpCards(){
    document.querySelectorAll('[data-size-help-card="1"]').forEach((node) => node.remove());
  }

  function sellerUrl(){
    const phone = window.__EMP24K_ROUTING__?.alliancePhone?.() || "5541995888995";
    const message = "Olá! Vim pela Coroa 24K e preciso de ajuda para descobrir a numeração dos meus dedos/aros.";
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  function isSizeHelpIntent(text){
    const sizeWords = /(aro|aros|numeracao|numeracoes|numero do dedo|numeros dos dedos|tamanho do anel|tamanho dos aneis|medida do dedo|medidas dos dedos)/;
    const helpWords = /(como|descobrir|descubro|saber|sei|medir|meço|medir meu dedo|qual meu tamanho|qual o meu tamanho|ajuda)/;
    return sizeWords.test(text) && helpWords.test(text);
  }

  function isUnknownSizes(text){
    return [
      "nao sei os aros", "ainda nao sei os aros", "nao sei o aro", "nao sei a numeracao",
      "nao sei as numeracoes", "nao sei meu tamanho", "nao sei o tamanho"
    ].some((term) => text.includes(term));
  }

  function openHelp(raw, options = {}){
    removeHelpCards();
    if(!options.fromButton) addMessage(escapeHtml(raw), "user");
    state.mode = "choice";
    const current = flow();
    if(current?.selected && current.stage === "sizes"){
      current.sizes = "";
    }
    addMessage("Claro! Posso te ajudar com isso. Você prefere <strong>receber ajuda direta de um vendedor</strong> ou <strong>descobrir a numeração sozinho(a)</strong> agora?");
    addChoices([
      {label:"Quero ajuda de um vendedor", href:sellerUrl()},
      {label:"Quero descobrir sozinho(a)", data:{sizeHelpAction:"self"}, kind:"store"}
    ]);
  }

  function askRingAvailability(){
    removeHelpCards();
    state.mode = "ring-check";
    addMessage("Perfeito. Você tem algum <strong>anel que já sirva corretamente</strong> no dedo que deseja medir?");
    addChoices([
      {label:"Tenho um anel que serve", data:{sizeHelpAction:"has-ring"}, kind:"store"},
      {label:"Não tenho um anel", data:{sizeHelpAction:"no-ring"}, kind:"store"}
    ]);
  }

  function showVideo(kind){
    removeHelpCards();
    state.mode = "video";
    const hasRing = kind === "has-ring";
    const src = hasRing ? "./videos/medir-com-anel.mp4" : "./videos/medir-sem-anel.mp4";
    const title = hasRing ? "Como descobrir o aro usando um anel que já serve" : "Como descobrir o aro sem ter um anel de referência";
    addMessage(`${hasRing ? "Ótimo." : "Sem problema."} Assista ao vídeo abaixo e faça a medição com calma. Depois, volte aqui e me informe as numerações dos aros.`);
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    card.dataset.sizeHelpCard = "1";
    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = src;
    video.setAttribute("aria-label", title);
    video.style.width = "100%";
    video.style.maxWidth = "560px";
    video.style.borderRadius = "16px";
    video.style.display = "block";
    card.appendChild(video);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function handleSubmit(event){
    const form = event.target.closest?.("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;
    const raw = String(input.value || "").trim();
    if(!raw) return;
    const text = normalize(raw);
    if(!isSizeHelpIntent(text) && !isUnknownSizes(text)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    input.value = "";
    openHelp(raw);
    input.focus();
  }

  function handleClick(event){
    const button = event.target.closest?.("button");
    if(!button) return;

    if(button.dataset.conversationUnknownSizes !== undefined){
      event.preventDefault();
      event.stopImmediatePropagation();
      addMessage("Ainda não sei os aros", "user");
      openHelp("Ainda não sei os aros", {fromButton:true});
      return;
    }

    const action = button.dataset.sizeHelpAction;
    if(!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    addMessage(escapeHtml(button.textContent), "user");
    if(action === "self") askRingAvailability();
    else if(action === "has-ring" || action === "no-ring") showVideo(action);
  }

  // Registrados imediatamente e em captura para vencer o fluxo que espera a numeração dos aros.
  document.addEventListener("submit", handleSubmit, true);
  document.addEventListener("click", handleClick, true);

  window.__ajudaArosV1 = Object.freeze({state, normalize, isSizeHelpIntent, isUnknownSizes, openHelp, askRingAvailability, showVideo, sellerUrl});
})();
