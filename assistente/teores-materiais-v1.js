(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const state = {busy:false, phone:null};

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

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

  function blocked(text){
    return includesAny(text, [
      "vender ouro", "vender prata", "compram ouro", "compram prata", "quanto pagam",
      "avaliar ouro", "avaliar prata", "cotacao do ouro", "valor da grama", "grama do ouro",
      "meu ouro", "ouro do cliente", "abater no valor", "ouro como entrada",
      "rastreio", "rastreamento", "frete", "sedex", "pagamento", "polimento",
      "conserto", "ajuste de aro", "aumentar aro", "diminuir aro"
    ]);
  }

  function learningIntent(text){
    return includesAny(text, [
      "o que e", "o que significa", "me explica", "como funciona", "qual a diferenca",
      "diferenca entre", "por que", "porque", "qual o teor", "teor do", "teor de",
      "quantos por cento", "e ouro de verdade", "ouro verdadeiro", "ouro puro",
      "qual e melhor", "qual escolher", "tipos de ouro", "quilates"
    ]);
  }

  function availabilityIntent(text){
    const action = /\b(fazem|faz|fabricam|fabrica|produzem|produz|confeccionam|confecciona|trabalham|trabalha|tem|teria|aceitam|aceita)\b/.test(text);
    const karat = /\b(10k|10 k|14k|14 k|18k|18 k|24k|24 k)\b/.test(text);
    return action && karat;
  }

  function topicCount(text){
    return [
      /\b(10k|10 k)\b/.test(text),
      /\b(14k|14 k)\b/.test(text),
      /\b(18k|18 k|ouro 750)\b/.test(text),
      /\b(24k|24 k|ouro puro)\b/.test(text),
      /\b(prata|925)\b/.test(text)
    ].filter(Boolean).length;
  }

  function classify(text){
    if(!text || text.length > 360 || blocked(text)) return null;

    const availability = availabilityIntent(text);
    const learning = learningIntent(text);
    const topics = topicCount(text);

    if(/\b(24k|24 k|ouro puro)\b/.test(text) && includesAny(text, [
      "por que nao", "porque nao", "nao fazem", "nao fabrica", "nao fabricam",
      "da para fazer", "pode fazer", "serve para alianca", "muito mole", "muito macio"
    ])) return "why24";

    if(availability){
      if(/\b(10k|10 k)\b/.test(text)) return "availability10";
      if(/\b(14k|14 k)\b/.test(text)) return "availability14";
      if(/\b(18k|18 k)\b/.test(text)) return "availability18";
      if(/\b(24k|24 k)\b/.test(text)) return "why24";
    }

    if(topics >= 2 || includesAny(text, [
      "ouro ou prata", "ouro e prata", "10k ou 18k", "10k e 18k", "18k ou 24k",
      "diferenca dos ouros", "diferenca entre os ouros", "tipos de ouro"
    ])) return "compare";

    if(learning){
      if(/\b(10k|10 k)\b/.test(text)) return "gold10";
      if(/\b(14k|14 k)\b/.test(text)) return "gold14";
      if(/\b(18k|18 k|ouro 750)\b/.test(text)) return "gold18";
      if(/\b(24k|24 k|ouro puro)\b/.test(text)) return "gold24";
      if(/\b(prata|925)\b/.test(text)) return "silver925";
      if(/\bouro\b/.test(text)) return "goldBroad";
    }

    if(includesAny(text, [
      "o que e ouro", "o que e prata", "me explica ouro e prata",
      "nao entendo de ouro", "nao entendo de prata"
    ])) return "compare";

    return null;
  }

  function answerText(topic){
    const responses = {
      availability10: "Fazemos, sim, alianças em <strong>ouro 10k</strong>. Ele possui 41,7% de ouro puro e costuma ter um valor mais acessível que o 18k. Qual modelo e largura você procura?",
      availability14: "No momento, ainda não trabalhamos com <strong>ouro 14k</strong>. Para alianças, temos produção em <strong>ouro 10k</strong> e <strong>ouro 18k</strong>.",
      availability18: "Fazemos, sim, alianças em <strong>ouro 18k</strong>. Ele possui 75% de ouro puro e é o teor mais tradicional para joias. Qual modelo e largura você procura?",
      why24: "O <strong>ouro 24k</strong> é praticamente ouro puro. Por ter pouca liga de outros metais, ele é macio demais para alianças de uso diário: risca e pode deformar com mais facilidade. Por isso, não produzimos alianças em 24k. Trabalhamos com <strong>ouro 10k</strong> e <strong>ouro 18k</strong>, que têm resistência mais adequada para esse tipo de peça.",
      gold10: "O <strong>ouro 10k</strong> possui 41,7% de ouro puro e o restante é formado por outros metais que dão resistência à peça. Ele é ouro verdadeiro e costuma ser uma opção mais acessível que o 18k.",
      gold14: "O <strong>ouro 14k</strong> possui cerca de 58,5% de ouro puro. No momento, ainda não produzimos alianças nesse teor; trabalhamos com ouro 10k e ouro 18k.",
      gold18: "O <strong>ouro 18k</strong>, também chamado de ouro 750, possui 75% de ouro puro e 25% de outros metais que dão resistência à joia. É o teor mais tradicional para alianças e joias no Brasil.",
      gold24: "O <strong>ouro 24k</strong> é praticamente ouro puro. Ele tem grande valor, mas é muito macio para alianças de uso diário, por isso usamos teores como 10k e 18k, que mantêm ouro verdadeiro com maior resistência.",
      silver925: "A <strong>prata 925</strong> possui 92,5% de prata pura e 7,5% de outros metais para dar resistência. Ela pode escurecer com o tempo por oxidação, o que é natural e não significa perda do teor; uma limpeza ou polimento recupera o brilho.",
      goldBroad: "O ouro usado em joias costuma ser misturado a outros metais para ganhar resistência. Os quilates mostram quanto ouro puro existe na peça: quanto maior o número, maior o teor de ouro. Para alianças, produzimos em ouro 10k e ouro 18k.",
      compare: "Os materiais mudam principalmente no teor, no valor e na manutenção. O <strong>ouro 10k</strong> tem 41,7% de ouro puro e é mais acessível; o <strong>ouro 18k</strong> tem 75% de ouro puro, maior valor e é o mais tradicional para joias; o <strong>ouro 24k</strong> é quase puro, mas é macio demais para alianças; e a <strong>prata 925</strong> tem 92,5% de prata pura, custa menos e pode oxidar, precisando de limpeza periódica. Para alianças, trabalhamos com ouro 10k, ouro 18k e prata 925. Ouro 14k ainda não está disponível."
    };
    return responses[topic];
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
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

  function whatsappUrl(karat){
    const message = `Olá! Vim pela Coroa 24K e quero conhecer alianças em ouro ${karat}.`;
    return `https://api.whatsapp.com/send/?phone=${choosePhone()}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  function addChoices(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    card.style.display = "grid";
    card.style.gap = "8px";

    [["Ver alianças em ouro 10k", "10k"], ["Ver alianças em ouro 18k", "18k"]].forEach(([label, karat]) => {
      const link = document.createElement("a");
      link.className = "action-btn wa";
      link.href = whatsappUrl(karat);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = label;
      card.appendChild(link);
    });

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
    addMessage(answerText(topic));
    if(["availability10", "availability14", "availability18", "why24", "compare"].includes(topic)) addChoices();
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

  window.__teoresMateriaisV1 = {normalize, classify, answerText};
})();