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

  function classify(text){
    if(!text || text.length > 260) return false;

    const reference = /\b(foto|fotos|imagem|imagens|print|prints|desenho|desenhos|referencia|referencias)\b/.test(text);
    if(!reference) return false;

    return includesAny(text, [
      "tenho uma foto", "tenho foto", "tenho uma imagem", "tenho imagem", "tenho um desenho",
      "tenho desenho", "tenho uma referencia", "tenho referencia", "possuo uma foto",
      "posso enviar", "posso mandar", "quero enviar", "quero mandar", "como envio",
      "como mandar", "onde envio", "onde mando", "por onde envio", "por onde mando",
      "mandar a foto", "enviar a foto", "mandar uma foto", "enviar uma foto",
      "mandar a imagem", "enviar a imagem", "mandar o desenho", "enviar o desenho",
      "mandar a referencia", "enviar a referencia", "fazer igual a foto", "fazer igual uma foto",
      "igual a uma foto", "igual a foto", "a partir de uma foto", "a partir de um desenho",
      "analisar a foto", "analisar uma foto", "analisar a referencia", "ver a foto",
      "consigo anexar", "da para anexar", "tem como anexar"
    ]);
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

  function whatsappUrl(raw){
    const message = `Olá! Vim pela Coroa 24K e quero enviar uma foto ou desenho de referência para uma peça personalizada.\n\nO que eu escrevi no assistente: ${raw}`;
    return `https://api.whatsapp.com/send/?phone=${choosePhone()}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
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
    link.textContent = "Enviar foto pelo WhatsApp";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 240));
    addMessage("Dá para desenvolver a peça a partir da sua foto ou desenho. <strong>Esta conversa não recebe imagens</strong>, então toque no botão abaixo e envie o arquivo pelo WhatsApp. Junto da imagem, conte se é uma aliança ou outra joia, o material desejado e as medidas que souber.");
    addButton(raw);
    state.busy = false;
    if(input) input.focus();
  }

  function clarifyBubble(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user") || bubble.dataset.referenceClarified === "1") return;

    let html = bubble.innerHTML;
    html = html
      .replace(/Envie a referência e os detalhes para montarmos o orçamento\./gi, "Para enviar a foto ou o desenho, use o botão do WhatsApp abaixo. Aqui você pode continuar me contando os detalhes por texto.")
      .replace(/Pode enviar a referência e me contar os detalhes que deseja\./gi, "Para enviar a foto ou o desenho, use o botão do WhatsApp abaixo. Aqui você pode continuar me contando os detalhes por texto.")
      .replace(/Pode enviar a foto ou o desenho de referência\./gi, "Use o botão do WhatsApp abaixo para enviar a foto ou o desenho.")
      .replace(/Envie sua ideia para a equipe montar o orçamento\./gi, "Conte a ideia por texto. Para enviar uma foto ou desenho, use o botão do WhatsApp.")
      .replace(/caso possua, diga que tem uma foto ou desenho de referência\./gi, "caso tenha uma foto ou desenho, diga “tenho uma referência” e eu mostro o botão para enviar pelo WhatsApp.");

    if(html !== bubble.innerHTML) bubble.innerHTML = html;
    bubble.dataset.referenceClarified = "1";
  }

  function clarifyButton(element){
    if(!(element instanceof HTMLElement)) return;
    const text = normalize(element.textContent);
    if(text === "enviar referencia") element.textContent = "Enviar foto pelo WhatsApp";
    if(text === "enviar ideia ao atendimento") element.textContent = "Enviar ideia pelo WhatsApp";
    if(text === "enviar projeto personalizado") element.textContent = "Enviar projeto pelo WhatsApp";
  }

  function processNode(node){
    if(!(node instanceof HTMLElement)) return;
    if(node.matches(".row:not(.user) .bubble")) clarifyBubble(node);
    if(node.matches("a,button")) clarifyButton(node);
    node.querySelectorAll?.(".row:not(.user) .bubble").forEach(clarifyBubble);
    node.querySelectorAll?.("a,button").forEach(clarifyButton);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    const messages = document.querySelector("#messages");
    if(!form || !input || !messages) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      if(!classify(normalize(raw))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw);
    }, true);

    processNode(messages);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(processNode));
    });
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__referenciaWhatsappV1 = {normalize, classify, clarifyBubble};
})();