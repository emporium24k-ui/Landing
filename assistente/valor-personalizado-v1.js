(() => {
  "use strict";

  let busy = false;

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function shouldHandle(text){
    const alliance = /\b(alianca|aliancas|aliansa|aliansas|alinca|alincas)\b/.test(text);
    const custom = /\b(personalizada|personalizadas|personalizado|personalizar|sob medida|do meu jeito|modelo proprio|exclusiva|exclusivo)\b/.test(text) ||
      text.includes("igual a foto") || text.includes("por foto") || text.includes("minha ideia");
    const value = /\b(valor|valores|preco|precos|quanto custa|quanto fica|orcamento)\b/.test(text);
    return alliance && custom && value;
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

  async function answer(raw, text){
    if(busy) return;
    busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 240));

    const gold = /\b(ouro|18k)\b/.test(text);
    const silver = /\b(prata|925)\b/.test(text);
    const ownGold = text.includes("meu ouro") || text.includes("ouro do cliente") || text.includes("proprio ouro");
    const material = gold ? "gold" : silver ? "silver" : null;
    const materialText = gold ? " em ouro 18k" : silver ? " em prata 925" : "";
    const ownGoldText = ownGold
      ? " Como você pretende usar seu próprio ouro, ele precisa ser avaliado; sendo adequado e suficiente, o orçamento pode considerar somente a mão de obra."
      : "";

    addMessage(`O valor de uma aliança personalizada${materialText} não é único, porque muda conforme <strong>largura, peso, formato, acabamento, pedras, detalhes e numerações</strong>.${ownGoldText} Para calcular corretamente, me conte como imagina o modelo e pode me dizer <strong>se possui</strong> uma foto ou desenho de referência.`);

    const catalog = window.__catalogoAliancasV1;
    if(catalog?.state){
      catalog.state.personalized = {stage:"idea", material, idea:"", sizes:""};
    }

    busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const text = normalize(raw);
      if(!shouldHandle(text)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, text);
    }, true);
  });

  window.__valorPersonalizadoV1 = {normalize, shouldHandle};
})();
