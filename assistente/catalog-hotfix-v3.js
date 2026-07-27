(() => {
  "use strict";

  const STORE_URL = "https://www.emporium24k.com.br/produtos/";
  let busy = false;

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const productWords = new Set([
    "joia", "joias", "semijoia", "semijoias",
    "colar", "colares", "corrente", "correntes", "pulseira", "pulseiras",
    "brinco", "brincos", "pingente", "pingentes", "tornozeleira", "tornozeleiras",
    "piercing", "piercings", "escapulario", "escapularios", "choker", "chokers"
  ]);

  const browsePhrases = new Set([
    "quero ver joias", "quero ver as joias", "quero ver semijoias", "quero ver as semijoias",
    "quero ver produtos", "quero ver os produtos", "quero ver pecas", "quero ver as pecas",
    "so quero ver", "quero so ver", "apenas quero ver", "quero apenas ver",
    "so quero olhar", "quero so olhar", "apenas quero olhar", "quero apenas olhar",
    "so estou olhando", "estou so olhando", "so olhando", "quero dar uma olhada",
    "outra peca", "outras pecas", "outra joia", "outras joias", "outro produto",
    "outros produtos", "outra opcao", "outras opcoes", "outro modelo", "outros modelos",
    "mais uma peca", "quero ver outra", "quero ver outras", "tem outra", "tem outras",
    "quero ver outras pecas", "quero ver outras joias", "quero ver outras opcoes",
    "so quero ver as opcoes", "quero ver as opcoes", "ver as opcoes", "ver opcoes",
    "quero ver os modelos", "so quero ver os modelos", "quais sao as opcoes",
    "quais opcoes", "mostrar opcoes", "me mostra as opcoes", "me mostre as opcoes",
    "quero conhecer as pecas", "quero olhar as pecas", "quero ver o catalogo",
    "abrir catalogo", "ver catalogo"
  ]);

  const blockedWords = new Set([
    "alianca", "aliancas", "aliansa", "aliansas",
    "consertar", "conserto", "arrumar", "reparar", "polir", "polimento",
    "vender", "vendo", "avaliar", "avaliacao", "compram",
    "quebrou", "quebrado", "quebrada", "rastreio", "rastreamento"
  ]);

  function hasBlockedContext(text){
    return text.split(" ").some((word) => blockedWords.has(word));
  }

  function isBrowseRequest(text){
    if(hasBlockedContext(text)) return false;
    if(browsePhrases.has(text)) return true;

    return /^(?:eu\s+)?(?:so|apenas)?\s*(?:quero|queria|gostaria de)?\s*(?:ver|olhar|conhecer|navegar)(?:\s+(?:as|os))?(?:\s+(?:joias|semijoias|pecas|produtos|modelos|opcoes|catalogo))?$/.test(text);
  }

  function isShortProduct(text){
    const words = text.split(" ").filter(Boolean);
    if(words.length > 5 || hasBlockedContext(text)) return false;
    if(!words.some((word) => productWords.has(word))) return false;

    return words.length === 1 ||
      /^(quero|queria|gostaria de|procuro|busco|tem|vende|vendem|mostrar|mostra|ver)\b/.test(text) ||
      /\b(de ouro|de prata|18k|925|banhada|banhado)\b/.test(text);
  }

  function shouldHandle(text){
    if(isBrowseRequest(text)) return "browse";
    if(isShortProduct(text)) return "product";
    return null;
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

  function addStoreButton(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card store-card compact-card";
    link.className = "action-btn store";
    link.href = STORE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Ver produtos no site";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw, mode){
    if(busy) return;
    busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 240));
    addMessage(mode === "browse"
      ? "Claro! Você pode ver livremente todas as joias e semijoias disponíveis, com fotos, valores e disponibilidade atualizados no site."
      : "Temos opções disponíveis no site. Vou abrir os modelos para você conferir.");
    addStoreButton();
    busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const mode = shouldHandle(normalize(raw));
      if(!mode) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, mode);
    }, true);
  });

  window.__catalogHotfixV3 = {normalize, shouldHandle, isBrowseRequest, isShortProduct};
})();
