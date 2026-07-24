(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const state = {
    awaitingOutsideLocation: false,
    cardContextUntil: 0,
    busy: false,
    phone: null,
    last: {}
  };

  const replies = {
    remoteCard: [
      "Sem problema! Para clientes de fora de Curitiba, enviamos um link de pagamento no cartão de crédito.",
      "Sim. Quem mora fora de Curitiba pode pagar no cartão por um link de pagamento enviado pela equipe.",
      "Você não precisa estar em Curitiba para pagar no cartão. Enviamos o link de pagamento para concluir o pedido."
    ],
    remoteCardCombined: [
      "Para clientes de fora de Curitiba, enviamos um link de pagamento no cartão de crédito. O parcelamento pode ser feito em até 12 vezes.",
      "Sim! Enviamos o link de pagamento para você pagar no cartão, mesmo morando fora de Curitiba.",
      "Atendemos normalmente quem mora em outra cidade: a equipe envia o link de pagamento no cartão e o pedido segue por Sedex."
    ],
    production: [
      "É bem rapidinho: o prazo de produção das alianças é de no máximo 7 dias.",
      "Nossas alianças ficam prontas em até 7 dias. Depois disso, seguimos com a entrega ou o envio.",
      "O prazo máximo para produzir as alianças é de 7 dias.",
      "Produzimos as alianças em até 7 dias, de forma bem rápida."
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

  function hasCardIntent(text){
    return /\b(cartao|credito)\b/.test(text) || includesAny(text, [
      "pagar parcelado", "pagamento parcelado", "link de pagamento"
    ]);
  }

  function isLocal(text){
    return includesAny(text, [
      "moro em curitiba", "sou de curitiba", "estou em curitiba", "aqui em curitiba",
      "moro na regiao de curitiba", "sou da regiao de curitiba", "regiao metropolitana de curitiba"
    ]);
  }

  function hasOutsideLocation(text){
    if(isLocal(text)) return false;

    if(includesAny(text, [
      "moro fora de curitiba", "sou de fora de curitiba", "nao moro em curitiba",
      "nao sou de curitiba", "moro em outra cidade", "sou de outra cidade",
      "moro em outro estado", "sou de outro estado", "moro longe", "sou do interior",
      "moro fora", "sou de fora"
    ])) return true;

    return /\b(moro|sou|estou)\s+(em|no|na|do|da)\s+[a-z0-9]/.test(text) && !/\bcuritiba\b/.test(text);
  }

  function isAllianceProductionQuestion(text){
    const mentionsAlliance = /\b(alianca|aliancas|aliansa|aliansas)\b/.test(text);
    const productionQuestion = includesAny(text, [
      "prazo de producao", "tempo de producao", "quanto tempo para produzir",
      "quanto tempo demora para fazer", "quanto tempo leva para fazer",
      "em quanto tempo fica pronta", "em quanto tempo ficam prontas",
      "quando fica pronta", "quando ficam prontas", "quantos dias para ficar pronta",
      "quantos dias para ficarem prontas", "demora quantos dias", "prazo das aliancas",
      "prazo da alianca", "quanto tempo demora a alianca", "quanto tempo demoram as aliancas"
    ]);

    if(productionQuestion && mentionsAlliance) return true;
    if(includesAny(text, ["prazo de producao das aliancas", "producao das aliancas", "aliancas ficam prontas"])) return true;
    return false;
  }

  function classify(text){
    if(isAllianceProductionQuestion(text)) return "production";

    const card = hasCardIntent(text);
    const outside = hasOutsideLocation(text);

    if(card && outside){
      state.awaitingOutsideLocation = false;
      state.cardContextUntil = 0;
      return "remoteCardCombined";
    }

    if(state.awaitingOutsideLocation && Date.now() <= state.cardContextUntil && outside){
      state.awaitingOutsideLocation = false;
      state.cardContextUntil = 0;
      return "remoteCard";
    }

    if(card){
      state.awaitingOutsideLocation = true;
      state.cardContextUntil = Date.now() + 10 * 60 * 1000;
    }else if(state.awaitingOutsideLocation && Date.now() > state.cardContextUntil){
      state.awaitingOutsideLocation = false;
    }

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

  function whatsappUrl(topic, raw){
    const message = topic === "production"
      ? `Olá! Quero confirmar o prazo e fazer um orçamento de alianças. Minha mensagem: ${raw}`
      : `Olá! Moro fora de Curitiba e gostaria de receber o link de pagamento no cartão. Minha mensagem: ${raw}`;
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

  function addButton(topic, raw){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    link.className = "action-btn wa";
    link.href = whatsappUrl(topic, raw);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = topic === "production" ? "Fazer orçamento" : "Solicitar link de pagamento";
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
    await new Promise((resolve) => setTimeout(resolve, 250));
    addMessage(pick(topic));
    addButton(topic, raw);
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

  window.__cartaoDistanciaPrazoV1 = {normalize, classify, replies, state};
})();