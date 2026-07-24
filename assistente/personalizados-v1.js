(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const state = {
    awaitingIdea: false,
    expiresAt: 0,
    originalQuestion: "",
    last: {},
    busy: false,
    phone: null
  };

  const replies = {
    startRing: [
      "Que ideia incrível! Fazemos alianças personalizadas em ouro 18k ou prata 925. Como você imagina o modelo: largura, acabamento, pedras ou gravação?",
      "Adorei a ideia! Podemos criar as alianças do seu jeito, inclusive a partir de foto ou desenho. O que você já imaginou para elas?",
      "Vai ficar muito especial! Me conte como você quer as alianças e quais detalhes não podem faltar."
    ],
    startJewelry: [
      "Que projeto lindo! Fazemos joias personalizadas em ouro 18k ou prata 925. Qual peça você imaginou e quais detalhes gostaria de colocar?",
      "Adorei! Podemos desenvolver a joia a partir de uma ideia, foto ou desenho. Me conta como ela seria.",
      "Vamos tirar essa ideia do papel! Qual joia você quer criar e o que não pode faltar nela?"
    ],
    startGeneric: [
      "Que legal! Fazemos peças personalizadas em ouro 18k e prata 925. Qual peça você imaginou e como gostaria que ela fosse?",
      "Adorei a ideia! Trabalhamos com projetos personalizados e molde 3D. Me conte o que você gostaria de criar.",
      "Vamos criar algo único! Você pensou em aliança, anel, pingente ou outra joia? Como imagina o modelo?"
    ],
    idea: [
      "Adorei esse conceito! Dá para a equipe analisar e transformar em um projeto exclusivo. Envie a referência e os detalhes para montarmos o orçamento.",
      "Essa ideia tem tudo para ficar linda! O próximo passo é conferir material, medidas e viabilidade do desenho.",
      "Muito boa a ideia! Vamos analisar os detalhes e preparar uma proposta personalizada para você.",
      "Ficaria uma peça muito especial! A equipe pode desenvolver o projeto com base nesses detalhes."
    ],
    inspiration: [
      "Sem problema! A equipe pode ajudar a desenvolver o modelo a partir do seu estilo, da ocasião e do orçamento.",
      "Tudo bem! Você não precisa chegar com o desenho pronto. Podemos ajudar a transformar uma ideia inicial em um projeto.",
      "Ótimo, podemos construir a ideia juntos! Basta contar o tipo de peça e o estilo que você gosta."
    ],
    quote: [
      "Para calcular o valor, precisamos entender o modelo, o material, as medidas e os detalhes da personalização. Envie sua ideia para a equipe montar o orçamento.",
      "O orçamento depende do projeto. Com a referência e os detalhes, a equipe calcula a melhor configuração para você.",
      "Como cada personalizado é único, o valor é definido depois de analisar o desenho, o material e as medidas."
    ],
    promptAgain: [
      "Me conte um pouco mais: qual peça você quer criar e como imagina o modelo?",
      "Qual seria a peça e quais detalhes você gostaria de colocar nela?",
      "Pode me dizer o tipo de joia, o material e o estilo que você imaginou?"
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
  const hasWord = (text, list) => {
    const words = new Set(text.split(" ").filter(Boolean));
    return list.some((item) => words.has(item));
  };

  const ringWords = ["alianca", "aliancas", "aliansa", "aliansas", "anel", "aneis", "solitario", "aparador"];
  const jewelryWords = [
    ...ringWords, "joia", "joias", "peca", "pecas", "pingente", "pingentes", "corrente",
    "correntes", "colar", "colares", "pulseira", "pulseiras", "brinco", "brincos",
    "tornozeleira", "tornozeleiras"
  ];

  function resetContext(){
    state.awaitingIdea = false;
    state.expiresAt = 0;
    state.originalQuestion = "";
  }

  function contextActive(){
    if(!state.awaitingIdea) return false;
    if(Date.now() <= state.expiresAt) return true;
    resetContext();
    return false;
  }

  function isStrongPersonalizedIntent(text){
    const explicit = includesAny(text, [
      "fazem personalizado", "fazem personalizados", "fazem personalizada", "fazem personalizadas",
      "fazem peca personalizada", "fazem pecas personalizadas", "fazem joia personalizada",
      "fazem joias personalizadas", "fazem alianca personalizada", "fazem aliancas personalizadas",
      "quero personalizar", "gostaria de personalizar", "quero uma peca personalizada",
      "quero uma joia personalizada", "quero uma alianca personalizada", "projeto personalizado",
      "modelo personalizado", "peca sob medida", "joia sob medida", "alianca sob medida",
      "quero criar uma joia", "quero criar uma alianca", "tenho uma ideia para uma joia",
      "tenho uma ideia para uma alianca", "quero fazer do meu jeito", "igual a uma foto",
      "igual a foto", "a partir de uma foto", "a partir de um desenho"
    ]);
    if(explicit) return true;

    const hasProduct = hasWord(text, jewelryWords);
    const customization = includesAny(text, [
      "personalizado", "personalizada", "personalizados", "personalizadas", "sob medida",
      "do meu jeito", "modelo exclusivo", "desenho proprio", "com minhas iniciais",
      "com iniciais", "com meu nome", "com nossos nomes", "com uma frase"
    ]);
    const intent = hasWord(text, ["quero", "queria", "gostaria", "fazer", "criar", "produzir", "desenvolver"]);
    return hasProduct && customization && intent;
  }

  function initialTopic(text){
    if(!isStrongPersonalizedIntent(text)) return null;
    if(hasWord(text, ringWords)) return "startRing";
    if(hasWord(text, jewelryWords)) return "startJewelry";
    return "startGeneric";
  }

  function followUpTopic(text){
    if(!contextActive()) return null;

    if(includesAny(text, [
      "rastreio", "rastreamento", "codigo de rastreio", "pix", "cartao", "boleto", "cheque",
      "forma de pagamento", "endereco", "onde fica", "frete", "sedex", "polimento",
      "conserto", "quero vender ouro", "vender minhas joias", "alianca encapada"
    ])){
      resetContext();
      return null;
    }

    if(includesAny(text, [
      "nao sei", "nao tenho ideia", "nao decidi", "quero sugestoes", "preciso de ideias",
      "me ajuda a escolher", "pode me ajudar", "ainda nao sei"
    ])) return "inspiration";

    if(includesAny(text, [
      "quanto custa", "qual o valor", "quanto fica", "preco", "orcamento", "valor aproximado"
    ])) return "quote";

    const designDetail = includesAny(text, [
      "quero com", "seria com", "imaginei", "pensei em", "gostaria com", "modelo",
      "foto", "imagem", "desenho", "referencia", "iniciais", "nome", "nomes", "data",
      "frase", "gravacao", "pedra", "pedras", "diamante", "zirconia", "safira", "ametista",
      "rubi", "esmeralda", "coracao", "coroa", "simbolo", "largura", "milimetros",
      "acabamento", "fosco", "polido", "chanfrado", "anatomico", "ouro", "prata"
    ]) || hasWord(text, jewelryWords) || /\b[2-9]\s*mm\b/.test(text);

    if(designDetail || text.length >= 35) return "idea";
    return "promptAgain";
  }

  function classify(text){
    return followUpTopic(text) || initialTopic(text);
  }

  function pick(topic){
    const list = replies[topic];
    let index;
    do index = Math.floor(Math.random() * list.length);
    while(index === state.last[topic] && list.length > 1);
    state.last[topic] = index;
    return list[index];
  }

  function choosePhone(){
    if(state.phone) return state.phone;
    try{
      const saved = sessionStorage.getItem("coroa24kSalesPhone");
      if(SALES.includes(saved)) return state.phone = saved;
      const data = new Uint32Array(1);
      crypto.getRandomValues(data);
      state.phone = SALES[data[0] % SALES.length];
      sessionStorage.setItem("coroa24kSalesPhone", state.phone);
    }catch(_){
      state.phone = SALES[Math.random() < 0.5 ? 0 : 1];
    }
    return state.phone;
  }

  function whatsappUrl(raw){
    const details = state.originalQuestion && state.originalQuestion !== raw
      ? `${state.originalQuestion}\nDetalhes: ${raw}`
      : raw;
    const message = `Olá! Quero criar uma peça personalizada. Minha ideia: ${details}`;
    return `https://api.whatsapp.com/send/?phone=${choosePhone()}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
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
    link.textContent = "Enviar ideia ao atendimento";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw, topic){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 260));
    addMessage(pick(topic));

    if(["startRing", "startJewelry", "startGeneric"].includes(topic)){
      state.awaitingIdea = true;
      state.expiresAt = Date.now() + 10 * 60 * 1000;
      state.originalQuestion = raw;
      addButton(raw);
    }else if(topic === "promptAgain"){
      state.awaitingIdea = true;
      state.expiresAt = Date.now() + 10 * 60 * 1000;
    }else{
      addButton(raw);
      resetContext();
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

  window.__personalizadosV1 = {normalize, classify, replies, state, resetContext};
})();
