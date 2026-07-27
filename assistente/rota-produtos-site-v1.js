(() => {
  "use strict";

  const STORE = "https://www.emporium24k.com.br/produtos/";
  const SEMIJOIAS = "https://www.emporium24k.com.br/semijoias/";
  const SEMIJOIAS_MASC = "https://www.emporium24k.com.br/semijoias/masculino/";
  const OURO_CORRENTES = "https://www.emporium24k.com.br/joias/masculino1/ouro-18k1/correntes/";
  const CARTIER_SEMI = "https://www.emporium24k.com.br/produtos/corrente-estilo-cartier-cubinho-15mm/";
  const state = { busy: false };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  const models = [
    ["elo portugues", "elo português"], ["cordao baiano", "cordão baiano"],
    ["rabo de rato", "rabo de rato"], ["grummet", "grumet"],
    ["groumet", "grumet"], ["grumet", "grumet"], ["cartier", "Cartier"],
    ["veneziana", "veneziana"], ["singapura", "singapura"],
    ["piastrine", "piastrine"], ["figaro", "figaro"], ["cubana", "cubana"],
    ["cadeado", "cadeado"], ["baiana", "baiana"]
  ];

  const products = [
    [/(?:^|\s)(?:anel|aneis)(?:\s|$)/, "anel"],
    [/(?:^|\s)solitarios?(?:\s|$)/, "solitário"],
    [/(?:^|\s)aparadores?(?:\s|$)/, "aparador"],
    [/(?:^|\s)correntes?(?:\s|$)/, "corrente"],
    [/(?:^|\s)(?:cordao|cordoes)(?:\s|$)/, "cordão"],
    [/(?:^|\s)colares?(?:\s|$)/, "colar"],
    [/(?:^|\s)pulseiras?(?:\s|$)/, "pulseira"],
    [/(?:^|\s)pingentes?(?:\s|$)/, "pingente"],
    [/(?:^|\s)brincos?(?:\s|$)/, "brinco"],
    [/(?:^|\s)tornozeleiras?(?:\s|$)/, "tornozeleira"]
  ];

  function firstMapped(text, map){
    for(const [key, label] of map){
      if(typeof key === "string" ? text.includes(key) : key.test(text)) return label;
    }
    return null;
  }

  function isBlocked(text){
    if(/(?:^|\s)aliancas?(?:\s|$)/.test(text)) return true;
    return includesAny(text, [
      "polimento", "polir", "conserto", "consertar", "reparar", "quebrou",
      "quero vender", "gostaria de vender", "avaliar meu", "compram meu",
      "rastreio", "rastreamento", "garantia", "nota fiscal", "certificado",
      "frete", "sedex", "entrega", "pagamento", "pix", "boleto", "cartao",
      "encapada", "meu ouro", "ouro do cliente", "abater no valor",
      "personalizada", "personalizado", "sob medida", "do meu jeito", "igual a foto"
    ]);
  }

  function classify(text){
    if(!text || text.length > 220 || isBlocked(text)) return null;

    const model = firstMapped(text, models);
    const product = firstMapped(text, products);
    const intent = /\b(quero|queria|gostaria|procuro|busco|preciso|tenho interesse|tem|teria|vendem|vende|comprar|valor|preco|quanto custa)\b/.test(text);
    const detail = /\b\d+(?:\.\d+)?\s*(?:mm|cm)\b/.test(text) || /\b(ouro|18k|prata|925|semijoia|banhada|banhado)\b/.test(text);

    if(model && (intent || detail || product)) return { model, product, text };
    if(product && intent && detail) return { model, product, text };
    if(product && intent && text.split(" ").length <= 8) return { model, product, text };
    return null;
  }

  function destination(data){
    const text = data.text;
    const gold = /\b(ouro|18k)\b/.test(text);
    const semi = /\b(semijoia|banhada|banhado)\b/.test(text);

    if(data.model === "Cartier"){
      if(gold) return [{ url: OURO_CORRENTES, label: "Ver Cartier em ouro 18k" }];
      if(semi) return [{ url: CARTIER_SEMI, label: "Ver Cartier em semijoia" }];
      return [
        { url: CARTIER_SEMI, label: "Ver Cartier em semijoia" },
        { url: OURO_CORRENTES, label: "Ver Cartier em ouro 18k" }
      ];
    }

    if(gold && ["corrente", "cordão", "colar", "pulseira"].includes(data.product)){
      return [{ url: OURO_CORRENTES, label: "Ver opções em ouro 18k" }];
    }

    if(semi || data.model){
      return [{ url: SEMIJOIAS_MASC, label: "Ver modelos no site" }];
    }

    if(data.product) return [{ url: SEMIJOIAS, label: "Ver joias e semijoias" }];
    return [{ url: STORE, label: "Ver produtos no site" }];
  }

  function response(data){
    const item = data.product ? `${data.product}${data.model ? ` modelo ${data.model}` : ""}` : `modelo ${data.model}`;
    if(data.model === "Cartier"){
      return `Temos modelos <strong>estilo Cartier</strong> cadastrados na loja online. Você pode conferir opções, medidas, valores e disponibilidade diretamente no site.`;
    }
    return `Ótima escolha! Para <strong>${escapeHtml(item)}</strong>, os modelos prontos, valores e disponibilidade atualizados ficam na nossa loja online.`;
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

  function addButtons(buttons){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    card.className = "action-card store-card";
    const text = document.createElement("p");
    text.textContent = "Consulte os modelos e a disponibilidade atualizada no site:";
    card.appendChild(text);

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gap = "8px";
    buttons.forEach((button) => {
      const link = document.createElement("a");
      link.className = "action-btn store";
      link.href = button.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = button.label;
      grid.appendChild(link);
    });
    card.appendChild(grid);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw, data){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 240));
    addMessage(response(data));
    addButtons(destination(data));
    state.busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const data = classify(normalize(raw));
      if(!data) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, data);
    }, true);
  });

  window.__rotaProdutosSiteV1 = { normalize, classify, destination };
})();