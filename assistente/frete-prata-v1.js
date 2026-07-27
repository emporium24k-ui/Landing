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

  const includesAny = (text, terms) => terms.some((term) => text.includes(term));

  function isShippingQuestion(text){
    return includesAny(text, [
      "frete", "sedex", "correios", "forma de envio", "como enviam", "como envia",
      "envio para", "enviam para", "mandam para", "entregam em", "transportadora",
      "envio gratis", "envio gratuito", "frete gratis", "frete gratuito"
    ]);
  }

  function catalogContext(){
    const material = window.__catalogoAliancasV1?.state?.lastCatalogMaterial;
    if(material === "silver") return "silver";
    if(material === "gold") return "gold";

    const rows = [...document.querySelectorAll("#messages .row")].slice(-8);
    for(let index = rows.length - 1; index >= 0; index -= 1){
      const text = normalize(rows[index].textContent);
      if(/\baliancas?\b/.test(text) && /\b(prata|925)\b/.test(text)) return "silver";
      if(/\baliancas?\b/.test(text) && /\b(ouro|18k|10k)\b/.test(text)) return "gold";
    }
    return "generic";
  }

  function shippingContext(text){
    const alliance = /\b(alianca|aliancas|aliansa|aliansas|alinca|alincas)\b/.test(text);
    const silver = /\b(prata|925)\b/.test(text);
    const gold = /\b(ouro|18k|10k)\b/.test(text);

    if(alliance && silver) return "silver";
    if(alliance && gold) return "gold";
    return catalogContext();
  }

  function response(context, text){
    const presencial = /\b(presencial|loja fisica|retirar na loja|retirada)\b/.test(text);
    if(context === "silver"){
      return presencial
        ? "Atendemos presencialmente em Curitiba e região. Para envio, as <strong>alianças de prata 925 não têm frete grátis</strong>; o valor é calculado conforme o CEP."
        : "As <strong>alianças de prata 925 não têm frete grátis</strong>. O valor do envio é calculado conforme o CEP e confirmado no pedido.";
    }
    if(context === "gold"){
      return presencial
        ? "Atendemos presencialmente em Curitiba e região. Para outras cidades, as alianças de ouro são enviadas gratuitamente por Sedex."
        : "Nas alianças de ouro, o envio é gratuito por Sedex para todo o Brasil.";
    }
    return presencial
      ? "Atendemos presencialmente em Curitiba e região e enviamos por Sedex para todo o Brasil. Alianças de ouro, joias e semijoias têm frete grátis; nas alianças de prata 925, o frete é calculado conforme o CEP."
      : "Enviamos por Sedex para todo o Brasil. Alianças de ouro, joias e semijoias têm frete grátis. Nas <strong>alianças de prata 925</strong>, o frete é calculado conforme o CEP.";
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

  async function answer(raw, context, text){
    if(busy) return;
    busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 220));
    addMessage(response(context, text));
    busy = false;
    if(input) input.focus();
  }

  function rewriteBubble(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user")) return;
    const text = normalize(bubble.textContent);
    if(!text) return;

    if(text.includes("estes sao modelos de prata 925") && (text.includes("frete gratis") || text.includes("promocoes"))){
      bubble.innerHTML = "Estes são modelos de <strong>prata 925</strong> com valores de referência do catálogo atual. As alianças acompanham gravações internas, garantia eterna do teor e caixinha. <strong>O frete é calculado conforme o CEP.</strong> A produção é feita em até 7 dias.";
      bubble.dataset.silverShippingCorrected = "1";
      return;
    }

    if(/\b(prata|925)\b/.test(text) && /\baliancas?\b/.test(text) && (text.includes("frete gratis") || text.includes("frete gratuito") || text.includes("sem custo de frete"))){
      bubble.innerHTML = "As <strong>alianças de prata 925 não têm frete grátis</strong>. O valor do envio é calculado conforme o CEP e confirmado no pedido.";
      bubble.dataset.silverShippingCorrected = "1";
      return;
    }

    if((text.includes("joias semijoias e aliancas") || text.includes("tanto para aliancas quanto para joias e semijoias")) && (text.includes("frete gratis") || text.includes("frete gratuito"))){
      bubble.innerHTML = "Enviamos por Sedex para todo o Brasil. Alianças de ouro, joias e semijoias têm frete grátis. Nas <strong>alianças de prata 925</strong>, o frete é calculado conforme o CEP.";
      bubble.dataset.silverShippingCorrected = "1";
    }
  }

  function scan(root = document){
    if(root.matches?.(".row:not(.user) .bubble")) rewriteBubble(root);
    root.querySelectorAll?.("#messages .row:not(.user) .bubble").forEach(rewriteBubble);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    const messages = document.querySelector("#messages");
    if(!form || !input || !messages) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const text = normalize(raw);
      if(!isShippingQuestion(text)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, shippingContext(text), text);
    }, true);

    scan(document);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if(node instanceof HTMLElement) scan(node);
      }));
    });
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__fretePrataV1 = {normalize, isShippingQuestion, shippingContext, response, scan};
})();
