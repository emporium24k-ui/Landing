(() => {
  "use strict";

  const EVALUATION_PHONE = "5541998518452";
  const state = { busy: false, lastReply: -1 };

  const replies = [
    "Perfeito! Compramos ouro e prata. A avaliação é feita presencialmente em Curitiba e considera o teor, o peso e as características da peça. Após a aprovação, o pagamento é realizado na hora.",
    "Entendi — a peça é sua e você quer vender. Compramos ouro e prata, com avaliação presencial em Curitiba conforme teor e peso. O responsável pode orientar você e combinar o atendimento.",
    "Sim, avaliamos ouro e prata para compra. A análise é presencial em Curitiba e o valor depende do teor e do peso da peça. Vou deixar o contato direto do responsável pela avaliação."
  ];

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bto\b|\btou\b/g, "estou")
    .replace(/\bpra\b/g, "para");

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function isAllianceUse(text){
    const alliance = /\b(alianca|aliancas|anel|aneis)\b/.test(text);
    const ownMaterial = includesAny(text, [
      "abater no valor", "usar meu ouro", "usar o meu ouro", "ouro como entrada",
      "parte do pagamento", "fazer alianca com meu ouro", "fazer a alianca com meu ouro",
      "transformar meu ouro em alianca", "ouro do cliente", "so mao de obra",
      "somente mao de obra", "reaproveitar meu ouro"
    ]);
    return alliance && ownMaterial;
  }

  function lastBotText(){
    const bubbles = [...document.querySelectorAll("#messages .row:not(.user) .bubble")];
    return normalize(bubbles.at(-1)?.textContent || "");
  }

  function previousUserText(){
    const bubbles = [...document.querySelectorAll("#messages .row.user .bubble")];
    return normalize(bubbles.at(-1)?.textContent || "");
  }

  function isOwnershipFollowUp(text){
    const shortOwnership = /^(?:sim )?(?:e |eh )?(?:meu|minha|meus|minhas|o meu|a minha|meu mesmo|minha mesmo|e minha peca|e meu ouro)$/.test(text);
    if(!shortOwnership) return false;
    const previousBot = lastBotText();
    const previousUser = previousUserText();
    const previousSaleMessage = /\b(ouro|prata|joia|joias|peca|pecas)\b.*\b(?:para vender|vender|avaliar)\b/.test(previousUser);
    return previousSaleMessage || includesAny(previousBot, [
      "avaliar uma peca sua", "vender uma peca sua", "quer vender a sua",
      "comprar uma joia ou vender", "ver joias da loja ou avaliar",
      "procura uma joia ou quer vender"
    ]) || window.__coordenadorCentralV1?.state?.intent === "sell_metals";
  }

  function looksLikeStoreOffering(text){
    return /^(?:voces |voce |a loja )?(?:tem|vende|vendem|possui|possuem)\b/.test(text) && /\b(?:para vender|a venda)\b/.test(text);
  }

  function classify(text){
    if(!text || text.length > 220 || isAllianceUse(text)) return false;
    if(isOwnershipFollowUp(text)) return true;

    const material = /\b(ouro|prata|joia|joias|peca|pecas|corrente|correntes|anel|aneis|alianca|aliancas)\b/.test(text);
    if(!material) return false;

    const firstPersonSell = /\b(eu|me|meu|minha|meus|minhas|tenho|estou|possuo|comigo|quero|queria|gostaria|posso|consigo|preciso)\b/.test(text) &&
      /\b(vender|vendo|venda|avaliar|avaliacao)\b/.test(text);

    const ownedForSale = /\b(estou com|tenho|possuo|trouxe|levei)\b.*\b(ouro|prata|joia|joias|peca|pecas)\b.*\b(?:para vender|para avaliar)\b/.test(text);

    const sellToStorePhrase = includesAny(text, [
      "te vender ouro", "te vender prata", "vender ouro para voces", "vender prata para voces",
      "vender ouro para voce", "vender prata para voce", "tem como vender ouro", "tem como vender prata",
      "posso vender ouro", "posso vender prata", "quero vender ouro", "quero vender prata",
      "tenho ouro para vender", "tenho prata para vender", "estou com ouro para vender",
      "estou com prata para vender", "levar ouro para vender", "levar prata para vender"
    ]);

    const storeBuys = /\b(voces|vcs|voce|a loja)\s+(compram|compra|aceitam|pegam|avaliam)\b/.test(text) ||
      /^(compram|compra|aceitam|avaliam)\s+(ouro|prata|joias|pecas)\b/.test(text);

    const priceForSelling = includesAny(text, [
      "quanto pagam no ouro", "quanto pagam na prata", "quanto voces pagam no ouro",
      "quanto voces pagam na prata", "valor para vender ouro", "valor para vender prata",
      "cotacao para vender ouro", "cotacao para vender prata", "avaliar meu ouro",
      "avaliar minha prata", "avaliar minhas joias", "avaliar minha joia"
    ]);

    const directOwnedSale = material && /\b(?:vender|avaliar)\b/.test(text) &&
      /\b(meu|minha|meus|minhas|tenho|estou|possuo|comigo)\b/.test(text) && !looksLikeStoreOffering(text);

    const bareForSale = /^(?:ouro|prata|joia|joias|peca|pecas|corrente|correntes|anel|aneis|alianca|aliancas)(?: de ouro| de prata)? (?:para vender|para avaliar)$/.test(text) && !looksLikeStoreOffering(text);

    return firstPersonSell || ownedForSale || sellToStorePhrase || storeBuys || priceForSelling || directOwnedSale || bareForSale;
  }

  function pickReply(){
    let index;
    do index = Math.floor(Math.random() * replies.length);
    while(index === state.lastReply && replies.length > 1);
    state.lastReply = index;
    return replies[index];
  }

  function conversationContext(raw){
    const userMessages = [...document.querySelectorAll("#messages .row.user .bubble")]
      .map((bubble) => String(bubble.textContent || "").trim())
      .filter(Boolean)
      .slice(-3);
    const current = String(raw || "").trim();
    if(current && userMessages.at(-1) !== current) userMessages.push(current);
    return userMessages.slice(-3).join(" | ") || current;
  }

  function syncCentralState(raw){
    const central = window.__coordenadorCentralV1;
    if(!central?.state) return;
    central.state.lastIntent = central.state.intent;
    central.state.intent = "sell_metals";
    central.state.product = "ouro/prata";
    const text = normalize(raw);
    if(/\bouro\b/.test(text)) central.state.material = "ouro";
    else if(/\bprata\b/.test(text)) central.state.material = "prata";
    central.state.stage = "avaliação para venda";
    central.state.lastUserMessage = String(raw || "").trim();
    central.save?.();
  }

  function whatsappUrl(raw){
    const message = `Olá! Quero avaliar ouro ou prata para venda.\n\nResumo da conversa: ${conversationContext(raw)}`;
    return `https://api.whatsapp.com/send/?phone=${EVALUATION_PHONE}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

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

  function addButton(raw){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    link.className = "action-btn wa";
    link.href = whatsappUrl(raw);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Falar com o responsável pela avaliação";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw){
    if(state.busy) return;
    state.busy = true;
    syncCentralState(raw);
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 220));
    addMessage(pickReply());
    addButton(raw);
    state.busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      if(!classify(normalize(raw))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw);
    }, true);
  });

  window.__vendaMetaisV1 = {normalize, classify, isOwnershipFollowUp, replies, whatsappUrl};
})();