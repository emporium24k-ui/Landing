(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const state = { awaitingChoice: false, busy: false, last: {} };

  const replies = {
    discount: [
      "Aceitamos, sim. O ouro é avaliado e o valor pode ser abatido da aliança.",
      "Sim. Avaliamos o teor e o peso do ouro para descontar no valor da aliança.",
      "Dá para usar seu ouro como parte do pagamento. A equipe faz a avaliação antes."
    ],
    ownGold: [
      "Sim. Podemos fazer a aliança com o seu próprio ouro e cobrar somente a mão de obra, após avaliar o material.",
      "Aceitamos o ouro do cliente para a confecção. Depois da análise, é cobrada apenas a mão de obra.",
      "Dá para produzir a aliança com o ouro que você trouxer. Primeiro avaliamos o teor e a quantidade."
    ],
    clarify: [
      "Aceitamos, sim. Você quer abater o ouro no valor da aliança ou usar o próprio ouro na confecção?",
      "Sim. Você pretende usar o ouro como pagamento ou fazer a aliança com esse material?",
      "Aceitamos. É para descontar no valor ou para produzir a aliança com o seu ouro?"
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
    const mentionsGold = /\bouro\b/.test(text);
    if(!mentionsGold && !state.awaitingChoice) return null;

    const ownGold = includesAny(text, [
      "fazer a alianca com meu ouro", "fazer alianca com meu ouro", "fazer com meu ouro",
      "usar meu ouro para fazer", "usar o meu ouro para fazer", "levar meu ouro para fazer",
      "trazer meu ouro para fazer", "fazer a alianca com o proprio ouro", "usar o proprio ouro",
      "reaproveitar meu ouro", "transformar meu ouro em alianca", "derreter meu ouro para fazer",
      "tenho ouro e quero fazer uma alianca", "cobram so a mao de obra", "somente a mao de obra"
    ]);

    const discount = includesAny(text, [
      "abater no valor", "abater o valor", "descontar no valor", "desconto na alianca",
      "ouro como entrada", "ouro de entrada", "ouro como pagamento", "parte do pagamento",
      "usar meu ouro no pagamento", "dar ouro na troca", "ouro na troca", "trocar ouro por alianca",
      "aceitam ouro para abater", "usar ouro para comprar alianca", "usar meu ouro na compra"
    ]);

    if(ownGold) return "ownGold";
    if(discount) return "discount";

    if(state.awaitingChoice){
      if(includesAny(text, ["fazer a alianca", "usar na confeccao", "meu proprio ouro", "mao de obra"])) return "ownGold";
      if(includesAny(text, ["abater", "descontar", "pagamento", "entrada", "troca"])) return "discount";
    }

    if(mentionsGold && includesAny(text, [
      "aceitam ouro", "pega ouro", "pegam ouro", "posso levar ouro", "posso usar ouro",
      "da para usar ouro", "recebem ouro", "trabalho com ouro do cliente"
    ])) return "clarify";

    return null;
  }

  function pick(topic){
    const list = replies[topic];
    let index;
    do index = Math.floor(Math.random() * list.length);
    while(index === state.last[topic]);
    state.last[topic] = index;
    return list[index];
  }

  function choosePhone(){
    try{
      const data = new Uint32Array(1);
      crypto.getRandomValues(data);
      return SALES[data[0] % SALES.length];
    }catch(_){
      return SALES[Math.random() < 0.5 ? 0 : 1];
    }
  }

  function whatsappUrl(topic, raw){
    const message = topic === "ownGold"
      ? `Olá! Quero fazer uma aliança usando meu próprio ouro. Minha dúvida: ${raw}`
      : `Olá! Quero usar ouro para abater no valor de uma aliança. Minha dúvida: ${raw}`;
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

  function addButton(topic, raw){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    const link = document.createElement("a");
    link.className = "action-btn wa";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.href = whatsappUrl(topic, raw);
    link.textContent = topic === "ownGold" ? "Calcular mão de obra" : "Avaliar ouro e aliança";
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
    await new Promise((resolve) => setTimeout(resolve, 280));
    addMessage(pick(topic));

    state.awaitingChoice = topic === "clarify";
    if(topic !== "clarify") addButton(topic, raw);

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

  window.__ouroNaAliancaV1 = {normalize, classify, replies, state};
})();
