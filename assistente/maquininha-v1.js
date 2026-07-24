(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const replies = [
    "Essa informação é confirmada diretamente pelo atendente.",
    "O atendente informa qual é a operadora da maquininha.",
    "Para confirmar a operadora da maquininha, fale com um de nossos atendentes."
  ];
  let busy = false;
  let lastReply = -1;
  let phone = null;

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function isMachineOperatorQuestion(text){
    const mentionsMachine = /\b(maquininha|maquina de cartao|operadora|adquirente)\b/.test(text);
    const mentionsBrand = /\b(stone|cielo|rede|getnet|pagseguro|mercado pago|sumup|safrapay|infinitepay)\b/.test(text);
    const asksWhich = /\b(qual|quais|qual e|qual eh|que operadora|que maquininha|voces usam|usam qual|trabalham com qual)\b/.test(text);
    return (mentionsMachine && asksWhich) || (mentionsBrand && /\b(usam|utilizam|trabalham|maquininha|operadora)\b/.test(text));
  }

  function choosePhone(){
    if(phone) return phone;
    try{
      const saved = sessionStorage.getItem("coroa24kSalesPhone");
      if(SALES.includes(saved)) return phone = saved;
      const data = new Uint32Array(1);
      crypto.getRandomValues(data);
      phone = SALES[data[0] % SALES.length];
      sessionStorage.setItem("coroa24kSalesPhone", phone);
    }catch(_){
      phone = SALES[Math.random() < 0.5 ? 0 : 1];
    }
    return phone;
  }

  function pickReply(){
    let index;
    do index = Math.floor(Math.random() * replies.length);
    while(index === lastReply && replies.length > 1);
    lastReply = index;
    return replies[index];
  }

  function whatsappUrl(raw){
    const message = `Olá! Gostaria de confirmar qual é a operadora da maquininha. Minha pergunta: ${raw}`;
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
    link.textContent = "Perguntar ao atendente";
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
    await new Promise((resolve) => setTimeout(resolve, 240));
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
      if(!isMachineOperatorQuestion(normalize(raw))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw);
    }, true);
  });

  window.__maquininhaV1 = {normalize, isMachineOperatorQuestion, replies};
})();