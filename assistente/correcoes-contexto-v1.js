(() => {
  "use strict";

  const state = {
    pendingField: null,
    busy: false
  };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));
  const flow = () => window.__catalogoConversaV2?.flow || null;
  const MAX_ENGRAVING = window.__gravacaoLimiteV2?.MAX || 15;

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
  }

  function money(value){
    if(value == null) return "valor sob confirmação";
    return new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(value);
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

  function addChoiceCard(options, before = null){
    const messages = document.querySelector("#messages");
    if(!messages) return null;
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    card.style.display = "grid";
    card.style.gap = "8px";

    options.forEach((option) => {
      const button = document.createElement(option.href ? "a" : "button");
      if(option.href){
        button.href = option.href;
        button.target = "_blank";
        button.rel = "noopener noreferrer";
      }else{
        button.type = "button";
      }
      button.className = `action-btn ${option.kind === "store" ? "store" : "wa"}`;
      button.textContent = option.label;
      Object.entries(option.data || {}).forEach(([key, value]) => {
        button.dataset[key] = value;
      });
      card.appendChild(button);
    });

    if(before?.parentNode === messages) messages.insertBefore(card, before);
    else messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
    return card;
  }

  function correctionSignal(text){
    return includesAny(text, [
      "na verdade", "na real", "pensando melhor", "mudei de ideia", "mudar de ideia",
      "quero mudar", "quero trocar", "gostaria de mudar", "gostaria de trocar",
      "corrigindo", "correcao", "retificando", "em vez de", "ao inves de",
      "prefiro agora", "decidi que", "agora quero", "quero que esteja gravado",
      "quero que fique gravado", "quero gravar"
    ]);
  }

  function correctionTarget(text){
    if(/\b(gravacao|gravar|gravado|gravada|nome dentro|frase dentro|data dentro|iniciais dentro)\b/.test(text)) return "engraving";
    if(/\b(aro|aros|numeracao|numeracoes|medida do dedo|medidas dos dedos|tamanho do anel|tamanhos dos aneis)\b/.test(text)) return "sizes";
    if(/\b(abaulado|abaulada|chanfrado|chanfrada|quinado|quinada|chapado|chapada|formato externo|formato da alianca)\b/.test(text)) return "format";
    if(/\b(anatomico|anatomica|semianatomico|semianatomica|semi anatomico|semi anatomica|interno reto|conforto interno)\b/.test(text)) return "comfort";
    if(/\b(outro modelo|trocar modelo|mudar modelo|modelo diferente|trocar material|mudar material|ouro 10k|ouro 18k|prata 925)\b/.test(text)) return "model";
    return null;
  }

  function expectedField(stage){
    return ({
      external_profile:"format",
      internal_comfort:"comfort",
      sizes:"sizes",
      engraving:"engraving"
    })[stage] || null;
  }

  function cleanCorrectionPrefix(raw){
    return String(raw || "")
      .trim()
      .replace(/^(?:na verdade|na real|pensando melhor|mudei de ideia|corrigindo|corre[cç][aã]o|retificando|agora)\s*[,;:\-]?\s*/i, "")
      .replace(/^(?:eu\s+)?(?:quero|gostaria|prefiro|decidi)\s+(?:mudar|trocar|corrigir)\s+(?:para|por|a|o|os|as)?\s*/i, "")
      .trim();
  }

  function normalizeFormat(raw){
    const api = window.__formatoExternoV1;
    if(api?.normalizeFormat) return api.normalizeFormat(raw);
    const text = normalize(raw);
    if(text.includes("abaulad")) return "Abaulado";
    if(text.includes("chanfrad") || text.includes("quinad")) return "Chanfrado/quinado";
    if(text.includes("chapad") || /\breto\b/.test(text)) return "Reto/chapado — formato original";
    return String(raw || "").trim();
  }

  function normalizeComfort(raw){
    const api = window.__catalogoConversaV2;
    if(api?.normalizeInternalComfort) return api.normalizeInternalComfort(raw);
    const text = normalize(raw);
    if(text.includes("semi anatom") || text.includes("semianatom")) return "Semianatômico";
    if(text.includes("anatom")) return "Anatômico";
    if(text.includes("interno reto") || /\breto\b/.test(text)) return "Reto";
    return String(raw || "").trim();
  }

  function normalizeSizes(raw){
    const text = normalize(raw);
    if(window.__catalogoConversaV2?.isUnknownSize?.(text)){
      return "Aros ainda não medidos; precisa de ajuda para descobrir";
    }
    return cleanCorrectionPrefix(raw)
      .replace(/^(?:os\s+)?(?:aros?|numeracoes?|medidas?)\s*(?:sao|serao|ficam|:)?\s*/i, "")
      .trim() || String(raw || "").trim();
  }

  function engravingParts(raw){
    const original = String(raw || "").trim();
    const text = normalize(original);
    if(includesAny(text, ["sem gravacao", "nao quero gravacao", "prefiro sem gravacao", "nenhuma gravacao"])){
      return {value:"Sem gravação", engravedText:"", placement:""};
    }
    if(includesAny(text, ["ainda nao decidi", "nao decidi", "depois eu vejo", "decido depois"])){
      return {value:"Ainda não decidi a gravação", engravedText:"", placement:""};
    }

    const both = includesAny(text, [
      "em ambas", "nas duas aliancas", "nos dois aneis", "nas duas", "nos dois",
      "para as duas aliancas", "para ambas as aliancas"
    ]);

    let cleaned = cleanCorrectionPrefix(original)
      .replace(/^(?:eu\s+)?(?:quero|gostaria|prefiro)?\s*(?:que\s+)?(?:esteja|fique|seja)?\s*(?:gravado|gravada|gravar|a\s+grava[cç][aã]o)\s*(?:seja|como|com|:)?\s*/i, "")
      .replace(/\s*(?:em ambas(?: as alian[cç]as)?|nas duas alian[cç]as|nos dois an[eé]is|nas duas|nos dois|para as duas alian[cç]as|para ambas as alian[cç]as)\s*$/i, "")
      .replace(/^["“”']+|["“”']+$/g, "")
      .trim();

    if(!cleaned) cleaned = original;
    const placement = both ? "em ambas as alianças" : "";
    return {
      engravedText: cleaned,
      placement,
      value: placement ? `“${cleaned}” em ambas as alianças` : cleaned
    };
  }

  function engravingCount(value){
    return Array.from(String(value || "").trim()).length;
  }

  function promptForStage(stage){
    if(stage === "external_profile"){
      addMessage("Continuamos de onde paramos: escolha o formato da aliança.");
      showFormatChoices();
    }else if(stage === "internal_comfort"){
      addMessage("Continuamos de onde paramos: escolha o conforto interno.");
      addChoiceCard([
        {label:"Anatômico", data:{correctionValue:"Anatômico", correctionField:"comfort"}},
        {label:"Semianatômico", data:{correctionValue:"Semianatômico", correctionField:"comfort"}},
        {label:"Interno reto", data:{correctionValue:"Reto", correctionField:"comfort"}}
      ]);
    }else if(stage === "sizes"){
      addMessage("Continuamos de onde paramos: informe as numerações dos dois aros ou diga que ainda não sabe.");
    }else if(stage === "engraving"){
      addMessage("Continuamos de onde paramos: informe a gravação interna, com até 15 caracteres, ou diga que ainda não decidiu.");
    }
  }

  function removeCardsByText(needles){
    document.querySelectorAll("#messages .action-card").forEach((card) => {
      const text = normalize(card.textContent);
      if(needles.some((needle) => text.includes(needle))) card.remove();
    });
  }

  function removeAllianceFinalCards(){
    document.querySelectorAll('#messages [data-correction-review="1"], #messages [data-correction-continue="1"]').forEach((node) => node.remove());
    removeCardsByText(["continuar com este modelo"]);
  }

  function allianceSummary(){
    const current = flow();
    const model = current?.selected;
    if(!model) return "";
    const parts = [
      model.name,
      model.material,
      `Valor de referência: ${money(model.price)}`,
      `Formato: ${current.externalProfile || "Ainda não decidido"}`,
      `Aros: ${current.sizes || "Ainda não informados"}`,
      `Gravação: ${current.engraving || "Ainda não informada"}`
    ];
    if(current.internalComfort) parts.splice(4, 0, `Conforto interno: ${current.internalComfort}`);
    return parts.join(" | ");
  }

  function allianceWhatsAppUrl(){
    const current = flow();
    const model = current?.selected;
    const phone = window.__EMP24K_ROUTING__?.alliancePhone?.() || "5541995888995";
    const discountLine = model?.material === "Ouro 18k"
      ? "\nQuero verificar o desconto disponível para este modelo em ouro."
      : "";
    const message = `Olá! Vim pela Coroa 24K e já escolhi um modelo de aliança.\n\n${allianceSummary()}${discountLine}`;
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  function makeReviewCard(){
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    card.dataset.correctionReview = "1";
    card.style.display = "grid";
    card.style.gap = "8px";

    const title = document.createElement("div");
    title.innerHTML = "<strong>Quer alterar alguma escolha?</strong>";
    title.style.color = "#f5df98";
    card.appendChild(title);

    [
      ["Alterar modelo ou material", "model"],
      ["Alterar formato", "format"],
      ["Alterar aros", "sizes"],
      ["Alterar gravação", "engraving"]
    ].forEach(([label, action]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-btn store";
      button.textContent = label;
      button.dataset.correctionAction = action;
      card.appendChild(button);
    });
    return card;
  }

  function makeContinueCard(){
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    card.dataset.correctionContinue = "1";
    link.className = "action-btn wa";
    link.href = allianceWhatsAppUrl();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Continuar com este modelo";
    card.appendChild(link);
    return card;
  }

  function ensureReviewCard(referenceCard = null){
    const messages = document.querySelector("#messages");
    if(!messages || !flow()?.selected || messages.querySelector('[data-correction-review="1"]')) return;
    const card = makeReviewCard();
    if(referenceCard?.parentNode === messages) messages.insertBefore(card, referenceCard);
    else messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function renderUpdatedAlliance(fieldLabel){
    const current = flow();
    if(!current?.selected) return;
    current.stage = null;
    removeAllianceFinalCards();
    addMessage(`${fieldLabel} atualizado com sucesso. Confira o resumo:<br><strong>${escapeHtml(allianceSummary())}</strong><br>Você ainda pode alterar outra escolha antes de abrir o WhatsApp.`);
    const messages = document.querySelector("#messages");
    if(!messages) return;
    messages.appendChild(makeReviewCard());
    messages.appendChild(makeContinueCard());
    messages.scrollTop = messages.scrollHeight;
  }

  function showFormatChoices(){
    addChoiceCard([
      {label:"Abaulado", data:{correctionField:"format", correctionValue:"Abaulado"}},
      {label:"Reto/chapado — formato original", data:{correctionField:"format", correctionValue:"Reto/chapado — formato original"}},
      {label:"Chanfrado/quinado", data:{correctionField:"format", correctionValue:"Chanfrado/quinado"}},
      {label:"Ainda não decidi", data:{correctionField:"format", correctionValue:"Ainda não decidido"}}
    ]);
  }

  function openModelChoice(){
    const current = flow();
    if(current){
      current.selected = null;
      current.stage = null;
      current.externalProfile = "";
      current.internalComfort = "";
      current.sizes = "";
      current.engraving = "";
    }
    removeAllianceFinalCards();
    addMessage("Sem problema. Como o modelo ou o material mudou, vou reabrir o catálogo para atualizar também o valor e evitar um orçamento incorreto.");
    addChoiceCard([
      {label:"Ver modelos em ouro 18k", data:{ringCatalog:"gold"}},
      {label:"Ver modelos em prata 925", data:{ringCatalog:"silver"}},
      {label:"Quero uma personalizada", data:{personalizedMaterial:"choose"}}
    ]);
  }

  function applyField(field, raw, options = {}){
    const current = flow();
    if(!current?.selected) return false;
    const previousStage = current.stage;

    if(field === "model"){
      openModelChoice();
      return true;
    }

    if(field === "format"){
      current.externalProfile = normalizeFormat(raw);
    }else if(field === "comfort"){
      current.internalComfort = normalizeComfort(raw);
    }else if(field === "sizes"){
      current.sizes = normalizeSizes(raw);
    }else if(field === "engraving"){
      const engraving = engravingParts(raw);
      if(engraving.engravedText && engravingCount(engraving.engravedText) > MAX_ENGRAVING){
        addMessage(escapeHtml(raw), "user");
        addMessage(`Essa gravação tem <strong>${engravingCount(engraving.engravedText)} caracteres</strong>. O máximo é <strong>${MAX_ENGRAVING}</strong>. Envie uma versão menor para atualizar o pedido.`);
        state.pendingField = "engraving";
        document.querySelector("#question")?.focus();
        return true;
      }
      current.engraving = engraving.value;
    }else{
      return false;
    }

    if(options.fromButton !== true) addMessage(escapeHtml(raw), "user");

    const expected = expectedField(previousStage);
    if(previousStage && expected && expected !== field){
      addMessage(`Atualizei <strong>${field === "format" ? "o formato" : field === "sizes" ? "os aros" : field === "engraving" ? "a gravação" : "o conforto interno"}</strong> sem apagar as outras escolhas.`);
      current.stage = previousStage;
      promptForStage(previousStage);
      return true;
    }

    if(previousStage && expected === field){
      if(field === "format" || field === "comfort"){
        current.stage = "sizes";
        addMessage("Escolha atualizada. Agora informe as numerações dos dois aros; caso ainda não saiba, pode dizer isso.");
      }else if(field === "sizes"){
        current.stage = "engraving";
        addMessage("Aros atualizados. Agora informe a gravação interna, com até 15 caracteres, ou diga que ainda não decidiu.");
      }else if(field === "engraving"){
        renderUpdatedAlliance("Gravação");
      }
      return true;
    }

    const label = field === "format" ? "Formato" : field === "sizes" ? "Aros" : field === "engraving" ? "Gravação" : "Conforto interno";
    renderUpdatedAlliance(label);
    return true;
  }

  function lastPersonalizedLink(){
    const links = [...document.querySelectorAll('#messages a.action-btn[href*="api.whatsapp.com/send"]')];
    return links.reverse().find((link) => normalize(link.textContent).includes("enviar ideia ao atendimento") || normalize(link.textContent).includes("enviar projeto pelo whatsapp")) || null;
  }

  function updatePersonalized(raw){
    const link = lastPersonalizedLink();
    if(!link) return false;
    const detail = cleanCorrectionPrefix(raw);
    const specialist = window.__EMP24K_ROUTING__?.specialistPhone?.() || window.__EMP24K_CONFIG__?.contacts?.personalized || "5541998518452";
    const message = `Olá! Quero criar uma peça personalizada. Correção da minha ideia: ${detail}`;
    link.closest(".action-card")?.remove();
    addMessage(escapeHtml(raw), "user");
    addMessage(`Entendi. Atualizei a descrição do projeto para: <strong>${escapeHtml(detail)}</strong>. A versão corrigida será enviada ao responsável.`);
    addChoiceCard([{
      label:"Enviar projeto corrigido pelo WhatsApp",
      href:`https://api.whatsapp.com/send/?phone=${specialist}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`
    }]);
    return true;
  }

  function cleanupStaleChoiceCards(text){
    if(!correctionSignal(text)) return;
    if(includesAny(text, ["abater no valor", "parte do pagamento", "ouro como entrada", "proprio ouro", "meu ouro para fazer", "fabricar com meu ouro"])){
      removeCardsByText(["avaliar ouro para fabricacao", "avaliar ouro e alianca"]);
    }
    if(includesAny(text, ["vender ouro", "vender prata", "avaliar ouro", "avaliar prata"])){
      removeCardsByText(["falar com o responsavel pela avaliacao"]);
    }
  }

  function handlePending(raw){
    const field = state.pendingField;
    if(!field) return false;
    state.pendingField = null;
    return applyField(field, raw);
  }

  function processSubmit(event){
    const form = event.target.closest("#composer");
    const input = document.querySelector("#question");
    if(!form || !input || state.busy) return;
    const raw = String(input.value || "").trim();
    if(!raw) return;
    const text = normalize(raw);

    cleanupStaleChoiceCards(text);

    if(state.pendingField){
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      state.busy = true;
      handlePending(raw);
      state.busy = false;
      input.focus();
      return;
    }

    const current = flow();
    const target = correctionTarget(text);
    const signal = correctionSignal(text);
    const engravingInExpectedStage = current?.stage === "engraving" && target === "engraving" && includesAny(text, ["em ambas", "nas duas", "nos dois"]);

    if(current?.selected && target && (signal || engravingInExpectedStage)){
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      state.busy = true;
      applyField(target, raw);
      state.busy = false;
      input.focus();
      return;
    }

    if(!current?.selected && signal && lastPersonalizedLink()){
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      state.busy = true;
      updatePersonalized(raw);
      state.busy = false;
      input.focus();
    }
  }

  function handleClick(event){
    const target = event.target.closest("button");
    if(!target) return;

    if(target.dataset.correctionAction){
      event.preventDefault();
      event.stopImmediatePropagation();
      const action = target.dataset.correctionAction;
      target.closest('[data-correction-review="1"]')?.remove();
      addMessage(escapeHtml(target.textContent), "user");

      if(action === "model"){
        openModelChoice();
      }else if(action === "format"){
        addMessage("Escolha o novo formato. As demais informações serão mantidas.");
        showFormatChoices();
      }else if(action === "sizes"){
        state.pendingField = "sizes";
        addMessage("Informe as novas numerações dos aros. Você também pode responder “ainda não sei”.");
      }else if(action === "engraving"){
        state.pendingField = "engraving";
        addMessage("Informe a nova gravação, com até 15 caracteres. Também pode dizer se será a mesma em ambas as alianças.");
      }
      document.querySelector("#question")?.focus();
      return;
    }

    if(target.dataset.correctionField){
      event.preventDefault();
      event.stopImmediatePropagation();
      const field = target.dataset.correctionField;
      const value = target.dataset.correctionValue || target.textContent;
      target.closest(".action-card")?.remove();
      addMessage(escapeHtml(value), "user");
      applyField(field, value, {fromButton:true});
      document.querySelector("#question")?.focus();
    }
  }

  function processNode(node){
    if(!(node instanceof HTMLElement)) return;
    const cards = [];
    if(node.matches?.(".action-card")) cards.push(node);
    node.querySelectorAll?.(".action-card").forEach((card) => cards.push(card));
    cards.forEach((card) => {
      if(normalize(card.textContent).includes("continuar com este modelo")){
        queueMicrotask(() => ensureReviewCard(card));
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const messages = document.querySelector("#messages");
    if(!form || !messages) return;
    form.addEventListener("submit", processSubmit, true);
    messages.addEventListener("click", handleClick, true);
    processNode(messages);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(processNode));
    });
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__correcoesContextoV1 = Object.freeze({
    state,
    normalize,
    correctionSignal,
    correctionTarget,
    engravingParts,
    applyField,
    allianceSummary,
    allianceWhatsAppUrl,
    updatePersonalized
  });
})();
