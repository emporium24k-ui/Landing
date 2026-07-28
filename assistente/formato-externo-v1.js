(() => {
  "use strict";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function rewriteBubble(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user")) return;
    let html = bubble.innerHTML;
    html = html
      .replace(
        /<strong>reto\/chapado<\/strong> é plano; e <strong>chanfrado\/quinado<\/strong> possui as laterais marcadas\. Você também pode manter exatamente o formato mostrado no modelo\. Alterar o desenho original pode mudar o valor final\./gi,
        "<strong>reto/chapado</strong> é o formato original, plano por fora; e <strong>chanfrado/quinado</strong> possui as laterais marcadas. Escolher abaulado ou chanfrado/quinado altera o desenho original e pode mudar o valor final."
      )
      .replace(/Você também pode manter exatamente o formato mostrado no modelo\.\s*/gi, "")
      .replace(/Alterar o desenho original pode mudar o valor final\./gi, "Escolher abaulado ou chanfrado/quinado altera o desenho original e pode mudar o valor final.");
    if(html !== bubble.innerHTML) bubble.innerHTML = html;
  }

  function rewriteChoices(root){
    const scope = root instanceof HTMLElement ? root : document;
    scope.querySelectorAll?.("button[data-conversation-external-profile]").forEach((button) => {
      const value = normalize(button.dataset.conversationExternalProfile || button.textContent);
      if(value.includes("manter") || value.includes("formato original do modelo")){
        button.remove();
        return;
      }
      if(value.includes("reto") || value.includes("chapado")){
        button.dataset.conversationExternalProfile = "Reto/chapado";
        button.textContent = "Reto/chapado — formato original";
      }
    });
  }

  function processNode(node){
    if(!(node instanceof HTMLElement)) return;
    if(node.matches(".row:not(.user) .bubble")) rewriteBubble(node);
    node.querySelectorAll?.(".row:not(.user) .bubble").forEach(rewriteBubble);
    rewriteChoices(node);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    const messages = document.querySelector("#messages");
    if(!form || !input || !messages) return;

    form.addEventListener("submit", () => {
      const flow = window.__catalogoConversaV2?.flow;
      if(flow?.stage !== "external_profile") return;
      const text = normalize(input.value);
      if(/\b(manter|original|igual ao modelo|como no modelo|formato do modelo)\b/.test(text)){
        input.value = "Reto/chapado";
      }
    }, true);

    processNode(messages);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(processNode));
    });
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__formatoExternoV1 = Object.freeze({rewriteBubble, rewriteChoices});
})();
