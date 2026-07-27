(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const flow = {
    busy: false,
    selected: null,
    stage: null,
    sizes: "",
    engraving: "",
    phone: null
  };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function choosePhone(){
    if(flow.phone) return flow.phone;
    try{
      const saved = sessionStorage.getItem("coroa24kSalesPhone");
      if(SALES.includes(saved)) return flow.phone = saved;
      const data = new Uint32Array(1);
      crypto.getRandomValues(data);
      flow.phone = SALES[data[0] % SALES.length];
      sessionStorage.setItem("coroa24kSalesPhone", flow.phone);
    }catch(_){
      flow.phone = SALES[Math.random() < 0.5 ? 0 : 1];
    }
    return flow.phone;
  }

  function allModels(){
    const api = window.__catalogoAliancasV1;
    if(!api?.CATALOG) return [];
    return [...(api.CATALOG.gold || []), ...(api.CATALOG.silver || [])];
  }

  function money(value){
    if(value == null) return "valor sob confirmação";
    return new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(value);
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
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
    card.style.display = "grid";
    card.style.gap = "8px";

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `action-btn ${option.kind === "store" ? "store" : "wa"}`;
      button.textContent = option.label;
      Object.entries(option.data || {}).forEach(([key, value]) => {
        button.dataset[key] = value;
      });
      card.appendChild(button);
    });

    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function removePrematureModelContacts(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    messages.querySelectorAll(".action-card").forEach((card) => {
      const text = normalize(card.textContent);
      if(includesAny(text, [
        "continuar com este modelo", "falar com vendedor", "consultar este modelo",
        "enviar pedido ao vendedor", "finalizar com atendente"
      ])) card.remove();
    });
  }

  function isUnknownSize(text){
    return includesAny(text, [
      "nao sei", "ainda nao sei", "nao sei o aro", "nao sei os aros",
      "nao sei a numeracao", "nao sei as numeracoes", "nao tenho a medida",
      "nao tenho as medidas", "nao faco ideia", "preciso medir", "nunca medi",
      "nao sei meu tamanho", "nao sei o tamanho", "sou leigo", "sou leiga"
    ]);
  }

  function isUnknownEngraving(text){
    return includesAny(text, [
      "nao sei", "ainda nao sei", "nao decidi", "sem gravacao", "nao quero gravacao",
      "depois eu vejo", "decido depois", "sem nome", "nenhuma gravacao"
    ]);
  }

  function genericAllianceInterest(text){
    if(!/\b(alianca|aliancas|aliansa|aliansas|alinca|alincas)\b/.test(text)) return false;
    if(includesAny(text, [
      "polimento", "polir", "conserto", "consertar", "ajustar", "aumentar", "diminuir",
      "meu ouro", "ouro do cliente", "encapada", "rastreio", "garantia", "prazo",
      "pagamento", "pix", "cartao", "frete", "entrega", "personalizada", "personalizado"
    ])) return false;
    if(/\b(ouro|prata|10k|14k|18k|24k|925|modelo|modelos|catalogo|valor|valores|preco|quanto|ver|mostrar)\b/.test(text)) return false;
    return /\b(quero|queria|gostaria|procuro|busco|interesse|interessado|interessada|tem|vendem|fazem|preciso)\b/.test(text);
  }

  function askModelsAndValues(raw){
    addMessage(escapeHtml(raw), "user");
    addMessage("Claro. Você quer ver os <strong>modelos e valores</strong> das alianças? Posso mostrar as opções de ouro e prata aqui na conversa.");
    addChoices([
      {label:"Ver modelos em ouro 18k", data:{ringCatalog:"gold"}},
      {label:"Ver modelos em prata 925", data:{ringCatalog:"silver"}},
      {label:"Quero uma personalizada", data:{personalizedMaterial:"choose"}}
    ]);
  }

  function selectModel(model){
    flow.selected = model;
    flow.stage = "sizes";
    flow.sizes = "";
    flow.engraving = "";
    removePrematureModelContacts();

    addMessage(`Quero o modelo ${escapeHtml(model.name)}`, "user");
    addMessage(`O modelo <strong>${escapeHtml(model.name)}</strong> em <strong>${escapeHtml(model.material)}</strong> aparece por <strong>${escapeHtml(money(model.price))}</strong> como valor de referência. Quais são as numerações dos dois aros? Caso ainda não saiba, pode responder simplesmente <strong>“não sei os aros”</strong>.`);
    addChoices([
      {label:"Ainda não sei os aros", data:{conversationUnknownSizes:"1"}}
    ]);
  }

  function receiveSizes(raw){
    const text = normalize(raw);
    addMessage(escapeHtml(raw), "user");

    if(isUnknownSize(text)){
      flow.sizes = "Aros ainda não medidos; precisa de ajuda para descobrir";
      addMessage("Sem problema. Você não precisa saber as numerações agora. O atendente pode orientar e ajudar a descobrir os dois aros. Você já sabe o que deseja gravar dentro das alianças?");
    }else{
      flow.sizes = raw;
      addMessage("Anotei as numerações. O que você deseja gravar dentro das alianças? Pode ser nomes, uma data ou uma frase curta. Caso ainda não tenha decidido, pode dizer isso.");
    }

    flow.stage = "engraving";
    addChoices([
      {label:"Ainda não decidi a gravação", data:{conversationUnknownEngraving:"1"}},
      {label:"Prefiro sem gravação", data:{conversationNoEngraving:"1"}}
    ]);
  }

  function receiveEngraving(raw){
    const text = normalize(raw);
    addMessage(escapeHtml(raw), "user");
    flow.engraving = isUnknownEngraving(text) ? raw : raw;
    finishConversation();
  }

  function summary(){
    const model = flow.selected;
    return `${model.name} | ${model.material} | Valor de referência: ${money(model.price)} | Aros: ${flow.sizes} | Gravação: ${flow.engraving}`;
  }

  function whatsappUrl(){
    const model = flow.selected;
    const discountLine = model?.material === "Ouro 18k"
      ? "\nQuero verificar o desconto disponível para este modelo em ouro."
      : "";
    const message = `Olá! Vim pela Coroa 24K e já escolhi um modelo de aliança.\n\n${summary()}${discountLine}`;
    return `https://api.whatsapp.com/send/?phone=${choosePhone()}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  function addWhatsAppButton(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    link.className = "action-btn wa";
    link.href = whatsappUrl();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Continuar com este modelo";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function finishConversation(){
    const model = flow.selected;
    const silver = model?.material === "Prata 925";
    const priceText = silver
      ? "O valor apresentado é o valor de referência desse modelo em prata."
      : "O valor apresentado é de referência; o vendedor confirma o desconto disponível para o modelo em ouro.";

    addMessage(`Certo. Ficou assim:<br><strong>${escapeHtml(summary())}</strong><br>${priceText} Agora você pode continuar no WhatsApp sem precisar explicar tudo novamente.`);
    addWhatsAppButton();
    flow.stage = null;
  }

  async function handleStage(raw){
    if(flow.busy) return;
    flow.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    await new Promise((resolve) => setTimeout(resolve, 160));
    if(flow.stage === "sizes") receiveSizes(raw);
    else if(flow.stage === "engraving") receiveEngraving(raw);
    flow.busy = false;
    if(input) input.focus();
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if(!target) return;

    if(target.dataset.ringModel){
      const model = allModels().find((item) => item.id === target.dataset.ringModel);
      if(!model) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      selectModel(model);
      return;
    }

    if(target.dataset.conversationUnknownSizes){
      event.preventDefault();
      event.stopImmediatePropagation();
      target.closest(".action-card")?.remove();
      if(flow.stage === "sizes") receiveSizes("Ainda não sei os aros");
      return;
    }

    if(target.dataset.conversationUnknownEngraving){
      event.preventDefault();
      event.stopImmediatePropagation();
      target.closest(".action-card")?.remove();
      if(flow.stage === "engraving") receiveEngraving("Ainda não decidi a gravação");
      return;
    }

    if(target.dataset.conversationNoEngraving){
      event.preventDefault();
      event.stopImmediatePropagation();
      target.closest(".action-card")?.remove();
      if(flow.stage === "engraving") receiveEngraving("Sem gravação");
    }
  }, true);

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;
    const raw = String(input.value || "").trim();
    const text = normalize(raw);

    if(flow.stage){
      event.preventDefault();
      event.stopImmediatePropagation();
      handleStage(raw);
      return;
    }

    if(genericAllianceInterest(text)){
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      askModelsAndValues(raw);
      input.focus();
    }
  }, true);

  window.__catalogoConversaV2 = {flow, normalize, genericAllianceInterest, isUnknownSize};
})();