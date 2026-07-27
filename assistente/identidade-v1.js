(() => {
  "use strict";

  const STORE_URL = "https://www.emporium24k.com.br/produtos/";
  const state = { busy: false, last: {} };

  const replies = {
    company: [
      "Somos a <strong>Emporium24k</strong>, uma empresa de joias de Curitiba especializada em alianças de ouro 18k e prata 925. Também trabalhamos com joias, semijoias, peças personalizadas, consertos e avaliação de ouro e prata. Temos fabricação própria, nota fiscal, certificado e envio grátis por Sedex para todo o Brasil.",
      "A <strong>Emporium24k</strong> é uma empresa de joias de Curitiba, com fabricação própria e especialização em alianças de ouro 18k e prata 925. Também oferecemos joias, semijoias, personalizados, consertos e avaliação de ouro e prata, com nota fiscal e envio grátis por Sedex para todo o Brasil.",
      "Nós somos a <strong>Emporium24k</strong>. Trabalhamos com alianças, joias e semijoias, além de projetos personalizados, consertos e avaliação de ouro e prata. Nossa empresa fica em Curitiba, possui fabricação própria e envia gratuitamente por Sedex para todo o Brasil."
    ],
    assistant: [
      "Eu sou a <strong>Coroa 24K</strong>, a assistente virtual da Emporium24k. Posso ajudar com dúvidas sobre alianças, joias, semijoias, materiais, garantias, pagamentos, prazos, envios, personalizados, consertos e avaliação de ouro ou prata.",
      "Sou a <strong>Coroa 24K</strong>, assistente virtual da Emporium24k. Estou aqui para explicar nossos produtos e serviços e ajudar você a encontrar rapidamente a informação ou o canal correto.",
      "Eu sou a <strong>Coroa 24K</strong> 👑, assistente virtual da Emporium24k. Você pode me perguntar sobre produtos, alianças, personalizados, garantia, pagamento, entrega, consertos ou venda de ouro e prata."
    ]
  };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function classify(text){
    if(!text || text.length > 140) return null;

    const assistantExact = new Set([
      "quem e voce", "quem e vc", "quem e a coroa 24k", "quem e coroa 24k",
      "o que e a coroa 24k", "o que e coroa 24k", "o que voce e", "o que vc e",
      "voce e robo", "voce e um robo", "voce e uma ia", "isso e um robo",
      "com quem estou falando", "com quem eu estou falando", "quem esta falando"
    ]);
    if(assistantExact.has(text)) return "assistant";

    const companyExact = new Set([
      "quem sao voces", "quem sao vcs", "quem e voces", "quem e vcs",
      "quem e a emporium24k", "o que e a emporium24k", "o que e emporium24k",
      "que empresa e essa", "qual empresa e essa", "qual e essa empresa",
      "quem e essa empresa", "fale sobre a empresa", "me fale sobre a empresa",
      "fale sobre voces", "me fale sobre voces", "sobre voces", "quem e a loja"
    ]);
    if(companyExact.has(text)) return "company";

    if(/^(quem|o que) (sao|e) (voces|vcs|a emporium24k|emporium24k)$/.test(text)) return "company";
    if(/^(quem|o que) (e|seria) (voce|vc|a coroa 24k|coroa 24k)$/.test(text)) return "assistant";
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
    link.href = STORE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Conhecer produtos e serviços";
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

  window.__identidadeV1 = { normalize, classify, replies };
})();