(() => {
  "use strict";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function isEncapadaRequest(text){
    const mentionsRing = /\b(alianca|aliancas|anel|aneis)\b/.test(text);
    const mentionsEncapada = /\b(encapada|encapadas|encapado|encapados)\b/.test(text);
    return mentionsRing && mentionsEncapada;
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function escapeHtml(value){
    return value.replace(/[&<>"']/g, (char) => ({
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

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const text = normalize(raw);
      if(!isEncapadaRequest(text)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      addMessage(escapeHtml(raw), "user");

      setTimeout(() => {
        addMessage("Não trabalhamos mais com alianças encapadas. Atualmente fazemos alianças em <strong>ouro 10k, ouro 18k ou prata 925</strong>.");
        input.focus();
      }, 260);
    }, true);
  });

  window.__encapadaHotfix = {normalize, isEncapadaRequest};
})();