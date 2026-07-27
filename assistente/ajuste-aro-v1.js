(() => {
  "use strict";

  const SERVICE_PHONE = "5541998518452";
  const state = { busy: false, lastReply: -1, awaitingDetails: false };

  const replies = [
    "Fazemos, sim, <strong>ajuste de aro em alianças e anéis</strong>. É possível aumentar ou diminuir a numeração. Caso você não saiba quanto precisa ajustar, não tem problema: o atendente ajuda a identificar a medida correta e calcula o valor do serviço.",
    "Sim! Fazemos <strong>ajuste do tamanho da aliança</strong>, tanto para aumentar quanto para diminuir o aro. Você não precisa saber a diferença exata de numeração; o atendente pode orientar e ajudar a descobrir o ajuste necessário.",
    "Trabalhamos com <strong>aumento e diminuição de aro</strong> em alianças e anéis. Se souber, informe a numeração atual e a desejada. Caso não saiba, envie uma foto e explique se a peça está apertada ou larga que o atendente orienta como descobrir a medida correta."
  ];

  const unknownReply = "Sem problema! Você <strong>não precisa saber quantos números</strong> deve aumentar ou diminuir. O atendente pode ajudar a descobrir a medida correta e orientar o ajuste. Basta informar se a peça está apertada ou larga e, se possível, enviar uma foto.";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function isUnknownSize(text){
    return includesAny(text, [
      "nao sei quanto", "nao sei quantos", "nao sei a numeracao", "nao sei o numero",
      "nao sei o aro", "nao sei a medida", "nao sei quanto ajustar", "nao sei quanto aumentar",
      "nao sei quanto diminuir", "nao tenho ideia", "nao sei dizer", "nao faco ideia"
    ]);
  }

  function classify(text){
    if(!text || text.length > 220) return false;
    if(state.awaitingDetails && isUnknownSize(text)) return "unknown_size";

    const ring = /\b(alianca|aliancas|aliansa|aliansas|alinca|alincas|anel|aneis|solitario|solitarios|aparador|aparadores)\b/.test(text);
    const resizeVerb = /\b(ajustar|ajuste|aumentar|aumento|diminuir|diminuicao|reduzir|alargar|apertar|redimensionar|redimensionamento|alterar|mudar|corrigir)\b/.test(text);
    const sizeWord = /\b(aro|aros|tamanho|tamanhos|numero|numeracao|medida|medidas)\b/.test(text);

    const direct = includesAny(text, [
      "ajustar minha alianca", "ajustar minhas aliancas", "ajustar meu anel", "ajustar meus aneis",
      "ajuste de alianca", "ajuste das aliancas", "ajuste do aro", "ajuste de aro",
      "aumentar o aro", "aumentar aro", "aumentar a alianca", "aumentar minha alianca",
      "diminuir o aro", "diminuir aro", "diminuir a alianca", "diminuir minha alianca",
      "mudar o tamanho da alianca", "alterar o tamanho da alianca", "trocar a numeracao",
      "mudar a numeracao", "alterar a numeracao", "corrigir a numeracao",
      "alargar a alianca", "apertar a alianca", "redimensionar a alianca", "redimensionar o anel",
      "alianca ficou apertada", "alianca esta apertada", "anel ficou apertado", "anel esta apertado",
      "alianca ficou larga", "alianca esta larga", "anel ficou largo", "anel esta largo",
      "alianca folgada", "anel folgado", "alianca nao cabe", "anel nao cabe",
      "alianca pequena", "alianca grande", "anel pequeno", "anel grande"
    ]);

    if(direct) return "resize";
    if(ring && resizeVerb) return "resize";
    if(ring && sizeWord && includesAny(text, ["ficou", "esta", "preciso", "quero", "gostaria", "da para", "tem como"])) return "resize";
    return false;
  }

  function pickReply(){
    let index;
    do index = Math.floor(Math.random() * replies.length);
    while(index === state.lastReply && replies.length > 1);
    state.lastReply = index;
    return replies[index];
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

  function whatsappUrl(raw){
    const message = `Olá! Quero solicitar um ajuste de aro em uma aliança ou anel. Ainda preciso de orientação para descobrir quanto aumentar ou diminuir.\n\nMinha dúvida: ${raw}`;
    return `https://api.whatsapp.com/send/?phone=${SERVICE_PHONE}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
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
    link.textContent = "Receber ajuda com a medida";
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
    addMessage(topic === "unknown_size" ? unknownReply : pickReply());
    addButton(raw);
    state.awaitingDetails = true;
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

  window.__ajusteAroV1 = {normalize, classify, replies, unknownReply, state};
})();