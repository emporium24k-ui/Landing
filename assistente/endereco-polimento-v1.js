(() => {
  "use strict";

  const SERVICE_PHONE = "5541998518452";
  const ADDRESS = "R. Jorn. Alceu Chichorro, 305 - Lj nº 14 - Bairro Alto, Curitiba - PR, 82820-290";
  const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
  const last = {};
  let busy = false;

  const replies = {
    address: [
      `Claro. Nosso endereço é: ${ADDRESS}`,
      `Atendemos nesse endereço: ${ADDRESS}`,
      `Você pode nos visitar em: ${ADDRESS}`
    ],
    polish: [
      "Sim, fazemos polimento de joias e alianças. É um serviço de valor acessível e avaliamos a peça antes.",
      "Fazemos, sim. O polimento de joias e alianças costuma ter um valor bem acessível.",
      "Podemos polir sua joia ou aliança. A equipe confere a peça e informa o valor do serviço."
    ],
    polishClarify: [
      "Fazemos polimento de joias e alianças. Qual é a peça?",
      "Sim, desde que seja uma joia ou aliança. Qual peça você quer polir?",
      "Nosso polimento é para joias e alianças. Me diga qual é a peça."
    ],
    polishUnsupported: [
      "Não fazemos polimento desse item. Nosso serviço é somente para joias e alianças.",
      "Esse tipo de polimento não realizamos. Trabalhamos apenas com joias e alianças.",
      "O polimento que fazemos é exclusivo para joias e alianças."
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

  function classify(text){
    const address = includesAny(text, [
      "qual o endereco", "qual endereco", "endereco da loja", "endereco exato",
      "onde fica a loja", "onde voces ficam", "onde fica", "como chegar",
      "quero visitar", "gostaria de visitar", "posso visitar", "ir ate a loja",
      "vou na loja", "localizacao da loja", "localizacao", "manda o endereco",
      "passe o endereco", "visitar a loja fisica", "loja fisica"
    ]);
    if(address) return "address";

    const polish = includesAny(text, [
      "polimento", "polir", "dar brilho", "recuperar o brilho", "tirar riscos",
      "tirar risco", "lustrar", "lustre da peca"
    ]);
    if(!polish) return null;

    const nonJewelry = includesAny(text, [
      "relogio", "carro", "moto", "aviao", "panela", "celular", "computador",
      "notebook", "oculos", "talher", "faca", "movel", "sapato", "bolsa"
    ]);
    if(nonJewelry) return "polishUnsupported";

    const jewelry = includesAny(text, [
      "joia", "joias", "alianca", "aliancas", "anel", "aneis", "corrente",
      "colar", "pulseira", "brinco", "pingente", "ouro", "prata", "solitario",
      "aparador", "tornozeleira"
    ]);
    return jewelry ? "polish" : "polishClarify";
  }

  function pick(topic){
    const list = replies[topic];
    let index;
    do index = Math.floor(Math.random() * list.length);
    while(index === last[topic] && list.length > 1);
    last[topic] = index;
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
    const message = `Olá! Vim pelo assistente Coroa 24K e gostaria de solicitar polimento de uma joia ou aliança. Minha dúvida: ${raw}`;
    return `https://api.whatsapp.com/send/?phone=${SERVICE_PHONE}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  async function answer(raw, topic){
    if(busy) return;
    busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 260));
    addMessage(pick(topic));

    if(topic === "address") addButton(MAPS_URL, "Abrir no mapa", "store");
    if(topic === "polish") addButton(serviceUrl(raw), "Solicitar polimento", "wa");

    busy = false;
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

  window.__enderecoPolimentoV1 = {normalize, classify, replies, ADDRESS};
})();
