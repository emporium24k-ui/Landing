(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const replies = [
    "Você acompanha pelo código de rastreio do Sedex. Se ainda não recebeu o código, a equipe verifica para você.",
    "O rastreamento é feito pelo código dos Correios. Vou te encaminhar caso precise confirmar o status.",
    "A equipe pode consultar o rastreamento do seu pedido e informar a atualização."
  ];
  let lastReply = -1;
  let busy = false;

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function isTrackingRequest(text){
    if(/\b(rastreio|rastrear|rastreamento|rastreando)\b/.test(text)) return true;

    const hasOrder = /\b(pedido|encomenda|entrega|envio|sedex|pacote)\b/.test(text);
    const wantsStatus = /\b(acompanhar|acompanho|consultar|consulta|verificar|ver|status|onde esta|onde ta|localizar)\b/.test(text);
    const sentQuestion = /(pedido|encomenda|pacote).*(foi enviado|saiu|chegou|esta onde|ta onde)/.test(text);
    return (hasOrder && wantsStatus) || sentQuestion;
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

  function pickReply(){
    let index;
    do index = Math.floor(Math.random() * replies.length);
    while(index === lastReply && replies.length > 1);
    lastReply = index;
    return replies[index];
  }

  function whatsappUrl(raw){
    const message = `Olá! Quero consultar o rastreamento do meu pedido. Minha mensagem: ${raw}`;
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

  function addButton(raw){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    const link = document.createElement("a");
    link.className = "action-btn wa";
    link.href = whatsappUrl(raw);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Consultar rastreamento";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw){
    if(busy) return;
    busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 260));
    addMessage(pickReply());
    addButton(raw);
    busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      if(!isTrackingRequest(normalize(raw))) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw);
    }, true);
  });

  window.__rastreamentoV1 = {normalize, isTrackingRequest, replies};
})();
