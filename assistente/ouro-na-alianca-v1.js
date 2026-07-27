(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const state = { awaitingChoice: false, busy: false, last: {}, phone: null };

  const replies = {
    discount: [
      "Aceitamos, sim. Primeiro avaliamos o teor e o peso do ouro; depois, o valor pode ser abatido da sua aliança.",
      "Sim! Seu ouro pode entrar como parte do pagamento. A equipe avalia o material e desconta o valor no orçamento da aliança.",
      "Dá para usar seu ouro para reduzir o valor da aliança. A avaliação do teor e do peso é feita antes do orçamento final."
    ],
    ownGold: [
      "Sim! Podemos fabricar as alianças usando o ouro que você já possui. Primeiro avaliamos o teor, a quantidade e as condições do material; sendo adequado, cobramos somente a mão de obra da confecção.",
      "Podemos, sim, produzir as alianças com o ouro do cliente. Após analisar o material e confirmar que a quantidade é suficiente, o orçamento considera apenas a mão de obra.",
      "Sim, fazemos com o seu próprio ouro. A equipe avalia o teor e o peso para verificar a viabilidade e, depois disso, calcula somente a mão de obra da fabricação."
    ],
    clarify: [
      "Aceitamos ouro, sim. Você quer usá-lo para abater no valor da aliança ou quer que a aliança seja fabricada com o próprio material?",
      "Temos as duas possibilidades: avaliar o ouro como parte do pagamento ou fabricar a aliança usando o seu ouro. Qual delas você procura?",
      "Sim! O ouro pode reduzir o valor do pedido ou ser utilizado na própria confecção da aliança. Como você pretende usar o material?"
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
    const alliance = /\b(alianca|aliancas|aliansa|aliansas|alinca|alincas|anel|aneis)\b/.test(text);
    const manufacture = /\b(fazer|fazem|faco|fabricar|fabricam|produzir|produzem|confeccionar|confeccionam|montar|montam)\b/.test(text);
    const ownership = /\b(meu|meus|proprio|proprios|tenho|possuo|trago|levo|der|dou|dar)\b/.test(text);

    const laborOnly = includesAny(text, [
      "so a mao de obra", "somente a mao de obra", "apenas a mao de obra",
      "quanto fica a mao de obra", "quanto custa a mao de obra", "cobram so mao de obra"
    ]);
    if(laborOnly) return "ownGold";

    if(!mentionsGold && !state.awaitingChoice) return null;

    const ownGoldPhrase = includesAny(text, [
      "fazer a alianca com meu ouro", "fazer alianca com meu ouro", "fazer as aliancas com meu ouro",
      "fabricar a alianca com meu ouro", "fabricar as aliancas com meu ouro",
      "fabricam a alianca com meu ouro", "fabricam as aliancas com meu ouro",
      "fazer com meu ouro", "fabricar com meu ouro", "produzir com meu ouro",
      "usar meu ouro para fazer", "usar o meu ouro para fazer", "usar meu ouro na confeccao",
      "levar meu ouro para fazer", "trazer meu ouro para fazer", "fazer a alianca com o proprio ouro",
      "usar o proprio ouro", "reaproveitar meu ouro", "transformar meu ouro em alianca",
      "derreter meu ouro para fazer", "tenho ouro e quero fazer uma alianca",
      "tenho o ouro e quero fazer", "tenho o ouro ja", "eu tenho o ouro ja",
      "se eu der o ouro", "se eu der meu ouro", "se eu levar o ouro", "se eu levar meu ouro",
      "eu dou o ouro", "eu levo o ouro", "ouro para voces fabricarem", "ouro pra voces fabricarem",
      "voces fabricam para mim", "voces fazem para mim com meu ouro"
    ]);

    const flexibleOwnGold = mentionsGold && manufacture && (
      alliance || ownership || /\b(se eu|para mim|pra mim|com ele|com esse material)\b/.test(text)
    );

    const discount = includesAny(text, [
      "abater no valor", "abater o valor", "descontar no valor", "desconto na alianca",
      "ouro como entrada", "ouro de entrada", "ouro como pagamento", "parte do pagamento",
      "usar meu ouro no pagamento", "dar ouro na troca", "ouro na troca", "trocar ouro por alianca",
      "aceitam ouro para abater", "usar ouro para comprar alianca", "usar meu ouro na compra",
      "diminuir o valor com ouro", "reduzir o valor com ouro"
    ]);

    if(ownGoldPhrase || flexibleOwnGold) return "ownGold";
    if(discount) return "discount";

    if(state.awaitingChoice){
      if(includesAny(text, ["fazer a alianca", "fabricar", "usar na confeccao", "meu proprio ouro", "mao de obra"])) return "ownGold";
      if(includesAny(text, ["abater", "descontar", "pagamento", "entrada", "troca", "reduzir o valor"])) return "discount";
    }

    if(mentionsGold && includesAny(text, [
      "aceitam ouro", "pega ouro", "pegam ouro", "posso levar ouro", "posso usar ouro",
      "da para usar ouro", "recebem ouro", "trabalham com ouro do cliente",
      "trabalha com ouro do cliente", "o que posso fazer com meu ouro"
    ])) return "clarify";

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
    const message = topic === "ownGold"
      ? `Olá! Quero fabricar alianças usando meu próprio ouro. Minha dúvida: ${raw}`
      : `Olá! Quero usar ouro para abater no valor de uma aliança. Minha dúvida: ${raw}`;
    return `https://api.whatsapp.com/send/?phone=${choosePhone()}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
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

  function addButton(topic, raw){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    link.className = "action-btn wa";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.href = whatsappUrl(topic, raw);
    link.textContent = topic === "ownGold" ? "Avaliar ouro para fabricação" : "Avaliar ouro e aliança";
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

  window.__ouroNaAliancaV2 = {normalize, classify, replies, state};
})();