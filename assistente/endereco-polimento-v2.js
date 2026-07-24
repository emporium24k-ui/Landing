(() => {
  "use strict";

  const SERVICE_PHONE = "5541998518452";
  const ADDRESS = "R. Jorn. Alceu Chichorro, 305 - Lj nº 14 - Bairro Alto, Curitiba - PR, 82820-290";
  const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
  const state = { awaitingPolishPiece: false, busy: false, last: {} };

  const replies = {
    address: [
      `Nosso endereço é: ${ADDRESS}`,
      `Você pode nos visitar em: ${ADDRESS}`,
      `Atendemos neste endereço: ${ADDRESS}`
    ],
    polish: [
      "Sim, fazemos polimento de joias e alianças. O serviço tem um valor acessível e a peça passa por uma análise rápida.",
      "Fazemos, sim. O polimento de joias e alianças costuma ter um valor bem acessível.",
      "Podemos polir sua joia ou aliança. A equipe avalia a peça e confirma o valor do serviço."
    ],
    polishClarify: [
      "Fazemos polimento de joias e alianças. Qual é a peça?",
      "Sim. Qual joia ou aliança você quer polir?",
      "Fazemos, sim. Me diga qual é a peça."
    ],
    polishUnsupported: [
      "Esse polimento não realizamos. Trabalhamos somente com joias e alianças.",
      "Nosso serviço de polimento é exclusivo para joias e alianças.",
      "Não fazemos polimento desse item."
    ]
  };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  const jewelryTerms = [
    "joia", "joias", "alianca", "aliancas", "aliansa", "aliansas", "alinca", "alincas",
    "anel", "aneis", "corrente", "colar", "pulseira", "brinco", "pingente", "ouro", "prata",
    "solitario", "aparador", "tornozeleira", "semijoia", "semijoias"
  ];

  const nonJewelryTerms = [
    "relogio", "carro", "moto", "aviao", "panela", "celular", "computador", "notebook",
    "oculos", "talher", "faca", "movel", "sapato", "bolsa"
  ];

  function hasJewelry(text){
    return includesAny(text, jewelryTerms);
  }

  function classify(text){
    if(state.awaitingPolishPiece){
      if(includesAny(text, nonJewelryTerms)) return "polishUnsupported";
      if(hasJewelry(text)) return "polish";
      return "polishClarify";
    }

    if(includesAny(text, [
      "qual o endereco", "qual endereco", "endereco da loja", "endereco exato",
      "onde fica a loja", "onde voces ficam", "onde fica", "como chegar",
      "quero visitar", "gostaria de visitar", "posso visitar", "ir ate a loja",
      "vou na loja", "localizacao da loja", "localizacao", "manda o endereco",
      "passe o endereco", "visitar a loja fisica", "loja fisica"
    ])) return "address";

    const asksPolish = includesAny(text, [
      "polimento", "polir", "dar brilho", "recuperar o brilho", "tirar riscos",
      "tirar risco", "lustrar", "lustre da peca"
    ]);
    if(!asksPolish) return null;

    if(includesAny(text, nonJewelryTerms)) return "polishUnsupported";
    if(hasJewelry(text)) return "polish";
    return "polishClarify";
  }

  function pick(topic){
    const list = replies[topic];
    let index;
    do index = Math.floor(Math.random() * list.length);
    while(index === state.last[topic] && list.length > 1);
    state.last[topic] = index;
    return list[index];
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function escapeHtml(value){
    return value.replace(/[&<>"']/g, (char) => ({
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
    stack.className = "message-stack";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = html;
    const meta = document.createElement("div");
    meta.className = "bubble-meta";
    meta.textContent = who === "user" ? clock() : `Coroa 24K · ${clock()}`;
    stack.append(bubble, meta);
    row.appendChild(stack);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function addButton(url, label, kind = "store"){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    card.className = `action-card ${kind === "store" ? "store-card" : ""} compact-card`;
    const link = document.createElement("a");
    link.className = `action-btn ${kind}`;
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function serviceUrl(raw){
    const message = `Olá! Gostaria de solicitar polimento de uma joia ou aliança. Minha mensagem: ${raw}`;
    return `https://api.whatsapp.com/send/?phone=${SERVICE_PHONE}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  async function answer(raw, topic){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 260));
    addMessage(pick(topic));

    state.awaitingPolishPiece = topic === "polishClarify";
    if(topic === "address") addButton(MAPS_URL, "Abrir no mapa", "store");
    if(topic === "polish") addButton(serviceUrl(raw), "Solicitar polimento", "wa");

    state.busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const topic = classify(normalize(raw));
      if(!topic) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, topic);
    }, true);
  });

  window.__enderecoPolimentoV2 = {normalize, classify, replies, state, ADDRESS};
})();
