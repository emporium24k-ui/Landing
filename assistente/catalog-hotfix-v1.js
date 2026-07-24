(() => {
  "use strict";

  const STORE_URL = "https://www.emporium24k.com.br/produtos/";
  const state = { waitingForProduct: false, busy: false };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const productWords = new Set([
    "colar", "colares", "corrente", "correntes", "pulseira", "pulseiras",
    "brinco", "brincos", "pingente", "pingentes", "tornozeleira", "tornozeleiras",
    "piercing", "piercings", "escapulario", "escapularios", "choker", "chokers"
  ]);

  const browsePhrases = new Set([
    "so quero ver as opcoes", "quero ver as opcoes", "ver as opcoes", "ver opcoes",
    "quero ver os modelos", "so quero ver os modelos", "quais sao as opcoes",
    "quais opcoes", "mostrar opcoes", "me mostra as opcoes", "me mostre as opcoes",
    "quero conhecer as pecas", "quero olhar as pecas", "so estou olhando",
    "so quero olhar", "quero ver o catalogo", "abrir catalogo", "ver catalogo",
    "quero ver as joias", "me mostra as joias", "me mostre as joias"
  ]);

  const otherProductPhrases = new Set([
    "outra peca", "outra joia", "outro produto", "outra opcao", "outro modelo",
    "mais uma peca", "quero ver outra", "tem outra"
  ]);

  function exactProduct(text){
    const words = text.split(" ").filter(Boolean);
    if(words.length > 4) return false;
    return words.some((word) => productWords.has(word));
  }

  function shouldHandle(text){
    if(browsePhrases.has(text)) return "browse";
    if(otherProductPhrases.has(text)) return "ask_product";
    if(exactProduct(text)) return "product";
    if(state.waitingForProduct && text.length <= 40) return "context_product";
    return null;
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

  function addStoreButton(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    card.className = "action-card store-card compact-card";
    const link = document.createElement("a");
    link.className = "action-btn store";
    link.href = STORE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Ver produtos";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw, mode){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 280));

    if(mode === "ask_product"){
      state.waitingForProduct = true;
      addMessage("Qual peça você quer ver?");
    }else{
      state.waitingForProduct = false;
      addMessage(mode === "browse" ? "Claro. As opções disponíveis estão na loja oficial." : "Temos, sim. Vou abrir as opções disponíveis para você.");
      addStoreButton();
    }

    state.busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const text = normalize(raw);
      const mode = shouldHandle(text);
      if(!mode) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, mode);
    }, true);
  });

  window.__catalogHotfix = {normalize, shouldHandle, state};
})();
