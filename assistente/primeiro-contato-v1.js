(() => {
  "use strict";

  const state = { busy: false, last: -1 };

  const introductions = [
    "Você está falando com a Coroa 24K, a assistente virtual da Emporium24k. Eu posso explicar nossos produtos, serviços, pagamentos, prazos e envios.",
    "Bem-vindo à Emporium24k! Este assistente ajuda você a conhecer nossas peças e encontrar rapidamente o atendimento certo.",
    "Este é o assistente virtual da Emporium24k. Por aqui você pode conhecer o que fazemos, tirar dúvidas e seguir para um atendente quando precisar."
  ];

  const summaries = [
    "Trabalhamos com alianças em ouro 18k e prata 925, joias, semijoias, projetos personalizados, consertos, polimento e avaliação de ouro ou prata usados. O que você procura?",
    "Somos especialistas em alianças e também trabalhamos com joias, semijoias, personalizados, consertos, polimento e compra de ouro ou prata usados. Escolha uma opção para eu te ajudar.",
    "Você pode procurar alianças, joias e semijoias, criar uma peça personalizada, solicitar conserto ou polimento e também avaliar ouro ou prata para venda. Por onde começamos?"
  ];

  const options = [
    { label: "Ver alianças", message: "Quero ver alianças", kind: "store" },
    { label: "Ver joias e semijoias", message: "Quero ver joias e semijoias", kind: "store" },
    { label: "Criar uma peça personalizada", message: "Quero uma peça personalizada", kind: "store" },
    { label: "Conserto ou polimento", message: "Preciso de conserto ou polimento de uma joia", kind: "wa" },
    { label: "Vender ouro ou prata", message: "Quero vender ouro ou prata", kind: "wa" }
  ];

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function isIntroQuestion(text){
    if(!text || text.length > 120) return false;

    const exact = [
      "o que voces vendem", "o que voce vende", "o que vcs vendem", "o que vendem", "o que vende",
      "o que tem aqui", "o que voces fazem", "o que voce faz", "com o que voces trabalham",
      "que site e esse", "o que e esse site", "do que se trata", "o que e isso",
      "o que e esse assistente", "como funciona esse assistente", "como funciona esse site",
      "pra que serve esse assistente", "para que serve esse assistente", "pra que serve esse site",
      "como voces podem me ajudar", "como voce pode me ajudar", "nao sei o que procurar",
      "nao sei do que se trata", "vim pelo anuncio", "cai aqui pelo anuncio"
    ];

    const cleaned = text.replace(/^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa)\s+/, "");
    if(exact.includes(cleaned)) return true;

    return includesAny(cleaned, [
      "queria saber o que voces vendem", "gostaria de saber o que voces vendem",
      "entrei e nao sei do que se trata", "nao entendi do que se trata",
      "vim do anuncio e nao sei como funciona", "cai aqui e nao sei como funciona",
      "pode me explicar o que voces fazem", "pode explicar o que e esse site"
    ]);
  }

  function pick(list){
    let index;
    do index = Math.floor(Math.random() * list.length);
    while(index === state.last && list.length > 1);
    state.last = index;
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

  function addOptions(){
    const messages = document.querySelector("#messages");
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!messages || !form || !input) return;

    const card = document.createElement("div");
    card.className = "action-card";

    const text = document.createElement("p");
    text.textContent = "Escolha o assunto mais próximo do que você precisa:";
    card.appendChild(text);

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gap = "8px";

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `action-btn ${option.kind}`;
      button.textContent = option.label;
      button.addEventListener("click", () => {
        grid.querySelectorAll("button").forEach((item) => { item.disabled = true; });
        input.value = option.message;
        if(typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit", {bubbles:true, cancelable:true}));
      });
      grid.appendChild(button);
    });

    card.appendChild(grid);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";

    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 230));
    addMessage(pick(introductions));
    await new Promise((resolve) => setTimeout(resolve, 210));
    addMessage(pick(summaries));
    addOptions();

    state.busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      if(!isIntroQuestion(normalize(raw))) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw);
    }, true);
  });

  window.__primeiroContatoV1 = {normalize, isIntroQuestion, introductions, summaries, options};
})();
