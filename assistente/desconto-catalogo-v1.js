(() => {
  "use strict";

  const GOLD_NOTICE = "Os valores das alianças em ouro 18k são referências. Fechando com um vendedor, o valor pode sair muito mais barato por causa dos descontos e promoções disponíveis para o ouro.";
  const GOLD_CARD_NOTICE = "Valor de referência. Consulte o vendedor para verificar os descontos disponíveis neste modelo em ouro 18k.";
  const SILVER_PROMOTION_SENTENCES = [
    "Promoções e condições diferentes podem ser confirmadas no fechamento.",
    "Fechando com um vendedor, o valor sai muito mais barato por causa dos descontos e promoções disponíveis.",
    "Valor de referência. Com o vendedor, este modelo sai muito mais barato por causa dos descontos disponíveis."
  ];

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function materialMode(text){
    const normalized = normalize(text);
    const gold = /\b(ouro 18k|18k)\b/.test(normalized);
    const silver = /\b(prata 925|925)\b/.test(normalized);
    if(gold && silver) return "mixed";
    if(gold) return "gold";
    if(silver) return "silver";
    return "unknown";
  }

  function isCatalogExplanation(text){
    const normalized = normalize(text);
    if(!normalized) return false;

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

  function cleanSilverPromotionText(element){
    if(!(element instanceof HTMLElement)) return;
    if(materialMode(element.textContent) !== "silver") return;

    let html = element.innerHTML;
    SILVER_PROMOTION_SENTENCES.forEach((sentence) => {
      html = html.replace(sentence, "");
    });
    html = html
      .replace(/<div[^>]*data-gold-discount-note="1"[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+\./g, ".")
      .trim();
    element.innerHTML = html;
  }

  function addBubbleNotice(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user")) return;

    cleanSilverPromotionText(bubble);
    if(bubble.dataset.catalogDiscount === "1" || !isCatalogExplanation(bubble.textContent)) return;

    const mode = materialMode(bubble.textContent);
    if(mode !== "gold" && mode !== "mixed") return;

    const note = document.createElement("div");
    note.dataset.goldDiscountNote = "1";
    note.style.marginTop = "10px";
    note.style.paddingTop = "9px";
    note.style.borderTop = "1px solid rgba(218,176,83,.22)";
    note.style.fontSize = ".9em";
    note.innerHTML = mode === "mixed"
      ? "<strong>Sobre o ouro 18k:</strong> os descontos e promoções são aplicados somente aos modelos de ouro. Nas alianças de prata 925, considere os valores exibidos."
      : `<strong>Economize nas alianças de ouro:</strong> ${GOLD_NOTICE}`;
    bubble.appendChild(note);
    bubble.dataset.catalogDiscount = "1";
  }

  function addCardNotice(card){
    if(!(card instanceof HTMLElement) || card.dataset.catalogDiscount === "1") return;
    const button = card.querySelector("button[data-ring-model]");
    if(!button) return;

    const mode = materialMode(card.textContent);
    if(mode === "silver"){
      card.querySelectorAll('[data-gold-discount-note="1"]').forEach((item) => item.remove());
      if(button.textContent === "Ver desconto deste modelo") button.textContent = "Quero este modelo";
      card.dataset.catalogDiscount = "silver-no-promotion";
      return;
    }
    if(mode !== "gold") return;

    const note = document.createElement("div");
    note.dataset.goldDiscountNote = "1";
    note.style.fontSize = ".82rem";
    note.style.lineHeight = "1.35";
    note.style.opacity = ".9";
    note.style.padding = "8px 10px";
    note.style.borderRadius = "10px";
    note.style.background = "rgba(218,176,83,.09)";
    note.textContent = GOLD_CARD_NOTICE;
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

  window.__descontoCatalogoV1 = {
    normalize,
    materialMode,
    isCatalogExplanation,
    GOLD_NOTICE,
    GOLD_CARD_NOTICE
  };
})();