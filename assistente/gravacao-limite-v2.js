(() => {
  "use strict";

  const MAX = 15;
  const POLICY = "A gravação gratuita é feita somente na parte interna das alianças e permite no máximo 15 caracteres. Acima disso não cabe na aliança e não é possível realizar a gravação.";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const undecided = (value) => {
    const text = normalize(value);
    return [
      "nao sei",
      "ainda nao sei",
      "ainda nao decidi",
      "ainda nao decidi a gravacao",
      "sem gravacao",
      "prefiro sem gravacao",
      "nao quero gravacao",
      "nenhuma gravacao",
      "depois eu vejo",
      "decido depois"
    ].some((item) => text === item || text.includes(item));
  };

  function count(value){
    return Array.from(String(value || "").trim()).length;
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

  function rewriteBubble(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user")) return;

    let html = bubble.innerHTML;
    html = html
      .replace(
        /A gravação gratuita é feita somente na parte interna das alianças, com até 15 caracteres\. Acima desse limite ou em uma gravação mais personalizada, também fazemos, mas o valor muda e é calculado conforme o pedido\./gi,
        POLICY
      )
      .replace(
        /A gravação gratuita é somente interna e aceita até 15 caracteres\. O que você deseja gravar\? Acima desse limite ou em algo mais personalizado, também fazemos, mas o valor muda\./gi,
        "A gravação é feita somente na parte interna e permite no máximo 15 caracteres. Acima disso não cabe na aliança. O que você deseja gravar?"
      )
      .replace(
        /A gravação gratuita é feita somente na parte interna, com até 15 caracteres\. Pode ser nomes, uma data ou uma frase curta\. Acima desse limite ou em algo mais personalizado, também fazemos, mas o valor muda\. Caso ainda não tenha decidido, pode dizer isso\./gi,
        "A gravação é feita somente na parte interna e permite no máximo 15 caracteres. Pode ser nomes, uma data ou uma frase curta. Acima disso não cabe na aliança. Caso ainda não tenha decidido, pode dizer isso."
      )
      .replace(
        /<strong>Gravação personalizada:<\/strong> o texto informado possui (\d+) caracteres e ultrapassa o limite gratuito de 15\. Conseguimos fazer, mas o valor muda e será calculado conforme o pedido\./gi,
        "<strong>Gravação acima do limite:</strong> o texto informado possui $1 caracteres. O máximo é 15, porque acima disso não cabe na parte interna da aliança e não é possível realizar a gravação."
      )
      .replace(
        /Acima desse limite ou em uma gravação mais personalizada, também fazemos, mas o valor muda[^<.]*(?:\.|$)/gi,
        "Acima de 15 caracteres não cabe na aliança e não é possível realizar a gravação."
      );

    if(html !== bubble.innerHTML) bubble.innerHTML = html;
  }

  function processNode(node){
    if(!(node instanceof HTMLElement)) return;
    if(node.matches(".row:not(.user) .bubble")) rewriteBubble(node);
    node.querySelectorAll?.(".row:not(.user) .bubble").forEach(rewriteBubble);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    const messages = document.querySelector("#messages");
    if(!form || !input || !messages) return;

    form.addEventListener("submit", (event) => {
      const flow = window.__catalogoConversaV2?.flow;
      if(flow?.stage !== "engraving") return;

      const raw = String(input.value || "").trim();
      if(!raw || undecided(raw) || count(raw) <= MAX) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      addMessage(escapeHtml(raw), "user");
      addMessage(`Essa gravação tem <strong>${count(raw)} caracteres</strong>. O máximo é <strong>${MAX}</strong>, porque acima disso não cabe na parte interna da aliança. Escreva uma versão menor para continuarmos.`);
      input.focus();
    }, true);

    processNode(messages);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(processNode));
    });
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__gravacaoLimiteV2 = {MAX, POLICY, normalize, count, undecided};
})();