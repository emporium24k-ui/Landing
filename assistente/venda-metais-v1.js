(() => {
  "use strict";

  const EVALUATION_PHONE = "5541998518452";
  const state = { busy: false, lastReply: -1 };

  const replies = [
    "Sim! Compramos ouro e prata. A avaliação considera o teor, o peso e as características da peça. Você pode enviar os detalhes para o setor responsável orientar os próximos passos.",
    "Compramos, sim, ouro e prata. Primeiro a equipe avalia o material e o peso para informar o valor corretamente. Vou deixar o contato direto do setor de avaliação.",
    "Sim, você pode vender seu ouro ou sua prata para nós. O valor é definido após a avaliação do teor e do peso da peça. O setor responsável pode orientar você diretamente."
  ];

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

  function classify(text){
    if(!text || text.length > 220 || isAllianceUse(text)) return false;

    const material = /\b(ouro|prata|joia|joias|peca|pecas|corrente|correntes|anel|aneis|alianca|aliancas)\b/.test(text);
    if(!material) return false;

    const firstPersonSell = /\b(eu|me|meu|minha|meus|minhas|tenho|quero|queria|gostaria|posso|consigo|preciso)\b/.test(text) &&
      /\b(vender|vendo|venda|avaliar|avaliacao)\b/.test(text);

    const sellToStorePhrase = includesAny(text, [
      "te vender ouro", "te vender prata", "vender ouro para voces", "vender prata para voces",
      "vender ouro pra voces", "vender prata pra voces", "vender ouro para voce",
      "vender prata para voce", "vender ouro pra voce", "vender prata pra voce",
      "tem como vender ouro", "tem como vender prata", "posso vender ouro", "posso vender prata",
      "quero vender ouro", "quero vender prata", "tenho ouro para vender", "tenho prata para vender",
      "tenho ouro pra vender", "tenho prata pra vender", "levar ouro para vender",
      "levar prata para vender", "levar ouro pra vender", "levar prata pra vender"
    ]);

    const storeBuys = /\b(voces|vcs|voce|a loja)\s+(compram|compra|aceitam|pegam|avaliam)\b/.test(text) ||
      /^(compram|compra|aceitam|avaliam)\s+(ouro|prata|joias|pecas)\b/.test(text);

    const priceForSelling = includesAny(text, [
      "quanto pagam no ouro", "quanto pagam na prata", "quanto voces pagam no ouro",
      "quanto voces pagam na prata", "valor para vender ouro", "valor para vender prata",
      "cotacao para vender ouro", "cotacao para vender prata", "avaliar meu ouro",
      "avaliar minha prata", "avaliar minhas joias", "avaliar minha joia"
    ]);

    return firstPersonSell || sellToStorePhrase || storeBuys || priceForSelling;
  }

  function pickReply(){
    let index;
    do index = Math.floor(Math.random() * replies.length);
    while(index === state.lastReply && replies.length > 1);
    state.lastReply = index;
    return replies[index];
  }

  function whatsappUrl(raw){
    const message = `Olá! Quero avaliar ouro ou prata para venda. Minha dúvida: ${raw}`;
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
    link.textContent = "Avaliar ouro ou prata";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 240));
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

  window.__vendaMetaisV1 = { normalize, classify, replies };
})();