(() => {
  "use strict";

  const config = window.__EMP24K_CONFIG__;
  const core = window.__coreIntencoesV1;
  if(!config || !core) return;

  let lastRecoveryAt = 0;

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function submitMessage(message){
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;
    input.value = message;
    form.dispatchEvent(new Event("submit", {bubbles:true, cancelable:true}));
  }

  function addRecoveryCard(){
    const messages = document.querySelector("#messages");
    if(!messages || messages.querySelector('[data-recovery-card="1"]')) return;
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    card.dataset.recoveryCard = "1";
    card.style.display = "grid";
    card.style.gap = "8px";
    const options = [
      ["Ver alianças e valores", "Quero ver modelos e valores de alianças"],
      ["Procurar joia ou semijoia", "Quero procurar uma joia ou semijoia"],
      ["Conserto, polimento ou ajuste", "Preciso de um serviço em uma joia"],
      ["Vender ou avaliar ouro/prata", "Quero vender ou avaliar ouro ou prata"]
    ];
    options.forEach(([label, message]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-btn store";
      button.textContent = label;
      button.addEventListener("click", () => {
        card.remove();
        submitMessage(message);
      });
      card.appendChild(button);
    });
    const contact = document.createElement("a");
    contact.className = "action-btn wa";
    contact.target = "_blank";
    contact.rel = "noopener noreferrer";
    contact.textContent = "Falar com atendente";
    contact.href = `https://api.whatsapp.com/send/?phone=${config.contacts.boss}&text=${encodeURIComponent("Olá! Vim pelo assistente Coroa 24K e preciso de ajuda para explicar o que procuro.")}&type=phone_number&app_absent=0`;
    card.appendChild(contact);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function processBubble(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user") || bubble.dataset.recoveryProcessed === "1") return;
    const text = core.normalize(bubble.textContent);
    const genericUnknown = text.includes("nao entendi") || text.includes("pode explicar de outra forma") || text.includes("me conta um pouco mais");
    if(!genericUnknown) return;
    bubble.dataset.recoveryProcessed = "1";
    bubble.innerHTML = "Não consegui identificar exatamente o que você procura. Escolha uma opção abaixo ou escreva o nome da peça ou do serviço.";
    if(Date.now() - lastRecoveryAt > 900){
      lastRecoveryAt = Date.now();
      queueMicrotask(addRecoveryCard);
    }
  }

  function scan(root = document){
    if(root.matches?.(".row:not(.user) .bubble")) processBubble(root);
    root.querySelectorAll?.("#messages .row:not(.user) .bubble").forEach(processBubble);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const messages = document.querySelector("#messages");
    if(!messages) return;
    scan(document);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if(node instanceof HTMLElement) scan(node);
    })));
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__recuperacaoConversaV1 = {submitMessage, addRecoveryCard};
})();
