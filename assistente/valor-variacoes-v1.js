(() => {
  "use strict";

  const state = { bypass: false };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function blocked(text){
    return /\b(frete|entrega|sedex|parcela|parcelas|juros|polimento|polir|conserto|consertar|mao de obra|rastreio|rastreamento)\b/.test(text) ||
      text.includes("quanto pagam") || text.includes("vender ouro") || text.includes("vender prata") ||
      text.includes("avaliar ouro") || text.includes("avaliar prata") || text.includes("preco do ouro") ||
      text.includes("valor do ouro") || text.includes("cotacao do ouro") || text.includes("grama do ouro");
  }

  function isValueVariation(text){
    if(!text || blocked(text)) return false;
    if(/\b(valor|valores|preco|precos|quanto custa|quanto fica|qual o valor|qual valor)\b/.test(text)) return false;

    return /\b(quanto e|quanto sai|quanto sairia|qual preco|que preco|me passa o valor|passa o valor|me fala o valor|sabe o valor|tem ideia do valor|quanto voces cobram|quanto cobram|quanto custa isso|preco disso|valor disso)\b/.test(text) ||
      /^(quanto e|quanto sai|quanto sairia|qual preco|que preco)$/.test(text);
  }

  function replaceDisplayedQuestion(messages, previousCount, raw){
    const bubbles = messages.querySelectorAll(".row.user .bubble");
    if(bubbles.length > previousCount){
      bubbles[bubbles.length - 1].textContent = raw;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    const messages = document.querySelector("#messages");
    if(!form || !input || !messages) return;

    form.addEventListener("submit", (event) => {
      if(state.bypass){
        state.bypass = false;
        return;
      }

      const raw = String(input.value || "").trim();
      const text = normalize(raw);
      if(!isValueVariation(text)) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const previousCount = messages.querySelectorAll(".row.user .bubble").length;
      state.bypass = true;
      input.value = `qual o valor ${raw}`;
      form.dispatchEvent(new Event("submit", {bubbles:true, cancelable:true}));
      replaceDisplayedQuestion(messages, previousCount, raw);
    }, true);
  });

  window.__valorVariacoesV1 = {normalize, isValueVariation, blocked};
})();