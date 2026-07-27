(() => {
  "use strict";

  const NOTICE = "Os valores exibidos no catálogo são referências. Fechando com um vendedor, o valor sai muito mais barato por causa dos descontos e promoções disponíveis.";
  const CARD_NOTICE = "Valor de referência. Com o vendedor, este modelo sai muito mais barato por causa dos descontos disponíveis.";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function isCatalogExplanation(text){
    const normalized = normalize(text);
    if(!normalized || normalized.includes("valor sai muito mais barato")) return false;

    const signals = [
      "valores de referencia do catalogo atual",
      "valores de referencia do catalogo",
      "vou mostrar as opcoes com os valores de referencia",
      "pares de aliancas em prata 925 comecam",
      "pares em prata 925 comecam",
      "modelos em ouro 18k comecam",
      "modelos em prata 925 comecam",
      "posso mostrar os modelos e valores aqui",
      "posso mostrar os modelos aqui mesmo",
      "claro posso mostrar os modelos aqui mesmo",
      "encontrei o modelo correspondente",
      "encontrei mais de uma opcao com esse nome",
      "voce prefere ouro 18k ou prata 925 para eu mostrar os modelos e valores"
    ];

    if(signals.some((signal) => normalized.includes(signal))) return true;
    return normalized.startsWith("o modelo ") && normalized.includes(" sai por ");
  }

  function addBubbleNotice(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.dataset.catalogDiscount === "1") return;
    if(bubble.closest(".row.user") || !isCatalogExplanation(bubble.textContent)) return;

    const note = document.createElement("div");
    note.style.marginTop = "10px";
    note.style.paddingTop = "9px";
    note.style.borderTop = "1px solid rgba(218,176,83,.22)";
    note.style.fontSize = ".9em";
    note.innerHTML = `<strong>Economize no atendimento:</strong> ${NOTICE}`;
    bubble.appendChild(note);
    bubble.dataset.catalogDiscount = "1";
  }

  function addCardNotice(card){
    if(!(card instanceof HTMLElement) || card.dataset.catalogDiscount === "1") return;
    const button = card.querySelector("button[data-ring-model]");
    if(!button) return;

    const note = document.createElement("div");
    note.style.fontSize = ".82rem";
    note.style.lineHeight = "1.35";
    note.style.opacity = ".9";
    note.style.padding = "8px 10px";
    note.style.borderRadius = "10px";
    note.style.background = "rgba(218,176,83,.09)";
    note.textContent = CARD_NOTICE;
    card.insertBefore(note, button);
    button.textContent = "Ver desconto deste modelo";
    card.dataset.catalogDiscount = "1";
  }

  function processNode(node){
    if(!(node instanceof HTMLElement)) return;

    if(node.matches(".row:not(.user) .bubble")) addBubbleNotice(node);
    if(node.matches(".action-card")) addCardNotice(node);

    node.querySelectorAll?.(".row:not(.user) .bubble").forEach(addBubbleNotice);
    node.querySelectorAll?.(".action-card").forEach(addCardNotice);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const messages = document.querySelector("#messages");
    if(!messages) return;

    processNode(messages);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(processNode));
    });
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__descontoCatalogoV1 = {normalize, isCatalogExplanation, NOTICE, CARD_NOTICE};
})();