(() => {
  "use strict";

  const state = { busy: false, last: {} };

  const replies = {
    intro: [
      "Você está falando com a Coroa 24K, a assistente virtual da Emporium24k. Posso apresentar nossos produtos e direcionar você para o assunto certo.",
      "Bem-vindo à Emporium24k! Por aqui você conhece nossas peças, serviços, pagamentos, prazos e formas de envio.",
      "Este é o assistente virtual da Emporium24k. Vou mostrar rapidamente o que fazemos para você escolher por onde começar."
    ],
    summary: [
      "Somos especialistas em alianças de ouro 18k e prata 925. Também trabalhamos com joias, semijoias, peças personalizadas, consertos, polimento e avaliação de ouro ou prata usados.",
      "Trabalhamos com alianças, joias em ouro 18k e prata 925, semijoias disponíveis na loja, personalizados, consertos, polimento e compra de ouro ou prata usados.",
      "Aqui você encontra alianças, joias, semijoias e projetos personalizados. Também realizamos consertos, polimento e avaliação de ouro ou prata para venda."
    ],
    jewelry: [
      "Sim! Trabalhamos com joias em ouro 18k e prata 925, além de semijoias disponíveis na loja e projetos personalizados. Você quer ver modelos prontos ou criar uma peça exclusiva?",
      "Trabalhamos, sim! Temos joias, semijoias e também produzimos peças personalizadas em ouro 18k ou prata 925. O que você está procurando?",
      "Sim! Você pode escolher uma joia ou semijoia pronta, ou desenvolver uma peça personalizada com a nossa equipe."
    ]
  };

  const mainOptions = [
    { label: "Ver alianças", message: "Quero ver alianças", kind: "store" },
    { label: "Ver joias e semijoias", message: "Quero ver joias e semijoias", kind: "store" },
    { label: "Criar uma peça personalizada", message: "Quero uma peça personalizada", kind: "store" },
    { label: "Conserto ou polimento", message: "Preciso de conserto ou polimento de uma joia", kind: "wa" },
    { label: "Vender ouro ou prata", message: "Quero vender ouro ou prata", kind: "wa" }
  ];

  const jewelryOptions = [
    { label: "Ver joias e semijoias", message: "Quero ver joias e semijoias", kind: "store" },
    { label: "Criar uma joia personalizada", message: "Quero criar uma joia personalizada", kind: "store" },
    { label: "Ver alianças", message: "Quero ver alianças", kind: "store" }
  ];

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function cleanGreeting(text){
    return text.replace(/^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa)\s+/, "").trim();
  }

  function classify(text){
    if(!text || text.length > 140) return null;
    const cleaned = cleanGreeting(text);

    const jewelryExact = [
      "voces trabalham com joias", "voce trabalha com joias", "trabalham com joias",
      "voces vendem joias", "voces tem joias", "tem joias", "vendem joias",
      "voces fazem joias", "fazem joias", "trabalham com semijoias",
      "voces trabalham com semijoias", "vendem semijoias", "tem semijoias"
    ];
    if(jewelryExact.includes(cleaned)) return "jewelry";

    if(/^(voces |voce )?(trabalham|trabalha|vendem|vende|fazem|faz|tem) com? (joias|semijoias)$/.test(cleaned)) return "jewelry";

    const introExact = [
      "o que voces vendem", "o que voce vende", "o que vcs vendem", "o que vendem", "o que vende",
      "o que tem aqui", "o que voces fazem", "o que voce faz", "com o que voces trabalham",
      "com que tipo de pecas voces trabalham", "com quais pecas voces trabalham",
      "que tipo de pecas voces trabalham", "quais pecas voces trabalham",
      "que pecas voces vendem", "quais pecas voces vendem", "que tipo de pecas voces vendem",
      "quais produtos voces vendem", "que produtos voces vendem", "quais produtos voces tem",
      "que tipos de joias voces trabalham", "com que tipo de joias voces trabalham",
      "que site e esse", "o que e esse site", "do que se trata", "o que e isso",
      "o que e esse assistente", "como funciona esse assistente", "como funciona esse site",
      "pra que serve esse assistente", "para que serve esse assistente", "pra que serve esse site",
      "como voces podem me ajudar", "como voce pode me ajudar", "nao sei o que procurar",
      "nao sei do que se trata", "vim pelo anuncio", "cai aqui pelo anuncio"
    ];
    if(introExact.includes(cleaned)) return "intro";

    if(/^(com que|com quais|que|quais) (tipo|tipos)? ?(de )?(peca|pecas|produto|produtos|joia|joias) (voces )?(trabalham|vendem|fazem|tem)$/.test(cleaned)) return "intro";

    if(includesAny(cleaned, [
      "queria saber o que voces vendem", "gostaria de saber o que voces vendem",
      "entrei e nao sei do que se trata", "nao entendi do que se trata",
      "vim do anuncio e nao sei como funciona", "cai aqui e nao sei como funciona",
      "pode me explicar o que voces fazem", "pode explicar o que e esse site",
      "queria saber com que pecas voces trabalham", "gostaria de saber quais produtos voces tem"
    ])) return "intro";

    return null;
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

  function addOptions(options){
    const messages = document.querySelector("#messages");
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!messages || !form || !input) return;

    const card = document.createElement("div");
    card.className = "action-card";
    const text = document.createElement("p");
    text.textContent = "Escolha uma opção para continuar:";
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

  async function answer(raw, topic){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";

    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 230));

    if(topic === "jewelry"){
      addMessage(pick("jewelry"));
      addOptions(jewelryOptions);
    }else{
      addMessage(pick("intro"));
      await new Promise((resolve) => setTimeout(resolve, 190));
      addMessage(pick("summary"));
      addOptions(mainOptions);
    }

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

  window.__primeiroContatoV2 = {normalize, classify, replies, mainOptions, jewelryOptions};
})();