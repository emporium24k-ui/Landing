(() => {
  "use strict";

  const SEMIJOIAS_URL = "https://www.emporium24k.com.br/semijoias/";
  const state = { busy: false, last: {} };

  const replies = {
    service: [
      "Não realizamos o serviço de banho de ouro em semijoias trazidas por clientes. Porém, vendemos semijoias novas, já banhadas com várias camadas, disponíveis na nossa loja online.",
      "Não recebemos semijoias de terceiros para aplicar ou renovar o banho. Na loja, você encontra semijoias novas que já recebem várias camadas de banho.",
      "O serviço de banho em peças de clientes nós não fazemos. Trabalhamos com a venda de semijoias novas, já banhadas com várias camadas, e os modelos disponíveis ficam no site."
    ],
    product: [
      "Sim. As semijoias que vendemos já são banhadas com várias camadas. Os modelos, valores e disponibilidade atualizados podem ser conferidos diretamente no site.",
      "Nossas semijoias são vendidas já banhadas com várias camadas. Você pode consultar as peças disponíveis e os valores na loja online.",
      "As semijoias disponíveis para venda já recebem várias camadas de banho. Vou deixar o acesso à categoria para você conhecer os modelos."
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
    if(!text || text.length > 180) return null;

    const jewelryContext = /\b(semijoia|semijoias|semi joia|semi joias|joia|joias|peca|pecas|anel|alianca|corrente|colar|pulseira|brinco|pingente)\b/.test(text);
    const mentionsBath = /\b(banho|banhada|banhadas|banhado|banhados|banhar|banham|rebanho|galvanoplastia)\b/.test(text);
    if(!mentionsBath) return null;

    const serviceRequest = includesAny(text, [
      "voces dao banho", "voce da banho", "vcs dao banho", "dao banho em",
      "fazem banho", "faz banho", "trabalham com banho", "servico de banho",
      "banham semijoia", "banham semijoias", "banham pecas", "banham joias",
      "posso levar", "posso mandar", "quero dar banho", "preciso dar banho",
      "renovar o banho", "refazer o banho", "restaurar o banho", "aplicar banho",
      "dar banho na minha", "dar banho no meu", "banho na minha peca",
      "banho de ouro na minha", "banho de ouro em semijoia", "fazem galvanoplastia"
    ]);

    if(serviceRequest || (/^(voces |voce |vcs )?(dao|da|fazem|faz) banho$/.test(text))) return "service";

    const productQuestion = jewelryContext && includesAny(text, [
      "sao banhadas", "e banhada", "sao banhados", "e banhado",
      "quantas camadas", "varias camadas", "qual o banho", "qual banho",
      "tem banho de ouro", "banhada a ouro", "banhado a ouro",
      "as semijoias tem banho", "semijoias tem banho"
    ]);

    return productQuestion ? "product" : null;
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

  function addStoreButton(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card store-card compact-card";
    link.className = "action-btn store";
    link.href = SEMIJOIAS_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Ver semijoias no site";
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
    await new Promise((resolve) => setTimeout(resolve, 240));
    addMessage(pick(topic));
    addStoreButton();
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

  window.__banhoSemijoiasV1 = { normalize, classify, replies };
})();
