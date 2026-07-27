(() => {
  "use strict";

  const SEARCH_BASE = "https://www.emporium24k.com.br/search/?q=";
  const state = {busy:false};

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
    ["cadeado", "cadeado"], ["baiana", "baiana"], ["riviera", "riviera"],
    ["ponto de luz", "ponto de luz"], ["ponto luz", "ponto de luz"],
    ["estrela de davi", "estrela de Davi"], ["estrela davi", "estrela de Davi"],
    ["espirito santo", "Espírito Santo"], ["sao jorge", "São Jorge"],
    ["olho grego", "olho grego"], ["flor de lis", "flor de lis"],
    ["tres por um", "3 por 1"], ["3 por 1", "3 por 1"],
    ["trevo", "trevo"], ["crucifixo", "crucifixo"], ["cruz", "cruz"],
    ["escapulario", "escapulário"], ["anilha", "anilha"], ["halter", "halter"],
    ["basquete", "basquete"], ["coracao", "coração"], ["infinito", "infinito"],
    ["borboleta", "borboleta"], ["argola", "argola"], ["tenis", "tênis"],
    ["tennis", "tênis"], ["solitario", "solitário"], ["aparador", "aparador"]
  ];

  const products = [
    [/(?:^|\s)(?:anel|aneis)(?:\s|$)/, "anel"],
    [/(?:^|\s)solitarios?(?:\s|$)/, "solitário"],
    [/(?:^|\s)aparadores?(?:\s|$)/, "aparador"],
    [/(?:^|\s)correntes?(?:\s|$)/, "corrente"],
    [/(?:^|\s)(?:cordao|cordoes)(?:\s|$)/, "cordão"],
    [/(?:^|\s)colares?(?:\s|$)/, "colar"],
    [/(?:^|\s)chokers?(?:\s|$)/, "choker"],
    [/(?:^|\s)pulseiras?(?:\s|$)/, "pulseira"],
    [/(?:^|\s)pingentes?(?:\s|$)/, "pingente"],
    [/(?:^|\s)brincos?(?:\s|$)/, "brinco"],
    [/(?:^|\s)tornozeleiras?(?:\s|$)/, "tornozeleira"],
    [/(?:^|\s)piercings?(?:\s|$)/, "piercing"],
    [/(?:^|\s)escapularios?(?:\s|$)/, "escapulário"]
  ];

  const STOPWORDS = new Set([
    "eu","voce","voces","vc","vcs","me","nos","tem","teria","possui","possuem",
    "vende","vendem","trabalha","trabalham","quero","queria","gostaria","procuro",
    "busco","buscando","preciso","comprar","ver","mostrar","mostra","mostre","confere",
    "conferir","favor","por","pra","para","qual","quais","quanto","custa","valor","preco",
    "modelo","modelos","estilo","tipo","opcao","opcoes","algum","alguma","algo","disponivel",
    "disponiveis","de","da","do","das","dos","um","uma","uns","umas","em","com","e","ou",
    "a","o","as","os","assim","igual","parecido","parecida","referente","referentes","site"
  ]);

  const PLURALS = Object.freeze({
    aneis:"anel", correntes:"corrente", cordoes:"cordao", colares:"colar", chokers:"choker",
    pulseiras:"pulseira", pingentes:"pingente", brincos:"brinco", tornozeleiras:"tornozeleira",
    piercings:"piercing", escapularios:"escapulario", semijoias:"semijoia", banhadas:"banhada",
    banhados:"banhado"
  });

  function firstMapped(text, map){
    for(const [key, label] of map){
      if(typeof key === "string" ? text.includes(key) : key.test(text)) return label;
    }
    return null;
  }

  function isBlocked(text){
    if(/(?:^|\s)(?:alianca|aliancas|aliansa|aliansas|alinca|alincas)(?:\s|$)/.test(text)) return true;
    return includesAny(text, [
      "polimento", "polir", "conserto", "consertar", "reparar", "quebrou", "ajustar aro",
      "quero vender", "gostaria de vender", "eu quero vender", "tenho para vender", "vender minha",
      "vender meu", "vender uma", "vender um", "avaliar meu", "avaliar minha", "compram meu",
      "compram minha", "rastreio", "rastreamento", "garantia", "nota fiscal", "certificado",
      "frete", "sedex", "entrega", "pagamento", "pix", "boleto", "cartao", "encapada",
      "meu ouro", "ouro do cliente", "abater no valor", "personalizada", "personalizado",
      "sob medida", "do meu jeito", "igual a foto", "foto de referencia"
    ]);
  }

  function materialLabel(text){
    const gold = /\b(ouro|18k|10k|14k)\b/.test(text);
    const silver = /\b(prata|925)\b/.test(text);
    const semi = /\b(semijoia|semijoias|banhada|banhado|folheada|folheado)\b/.test(text);
    if(semi && gold) return "semijoia banhada a ouro";
    if(semi && silver) return "semijoia banhada a prata";
    if(gold) return text.includes("10k") ? "ouro 10k" : text.includes("14k") ? "ouro 14k" : "ouro 18k";
    if(silver) return "prata 925";
    if(semi) return "semijoia";
    return "";
  }

  function explicitModel(text){
    const match = text.match(/\b(?:modelo|estilo)\s+([a-z0-9. ]{2,70})/);
    if(!match) return "";
    return match[1]
      .split(" ")
      .filter((word) => word && !STOPWORDS.has(word))
      .slice(0, 5)
      .join(" ");
  }

  function buildSearchQuery(text, product, model){
    const normalizedTokens = text.split(" ")
      .map((token) => PLURALS[token] || token)
      .filter((token) => token && !STOPWORDS.has(token));

    const parts = [];
    if(product) parts.push(normalize(product));
    if(model) parts.push(normalize(model));

    const phrase = explicitModel(text);
    if(phrase) parts.push(phrase);

    const material = materialLabel(text);
    if(material) parts.push(normalize(material));

    const measurements = text.match(/\b\d+(?:\.\d+)?\s*(?:mm|cm)\b/g) || [];
    parts.push(...measurements.map((item) => item.replace(/\s+/g, "")));

    parts.push(...normalizedTokens);

    const words = [];
    parts.join(" ").split(" ").forEach((word) => {
      if(!word || STOPWORDS.has(word) || words.includes(word)) return;
      words.push(word);
    });

    return words.slice(0, 9).join(" ").trim();
  }

  function classify(text){
    if(!text || text.length > 240 || isBlocked(text)) return null;

    const model = firstMapped(text, models);
    const product = firstMapped(text, products);
    const namedModel = explicitModel(text);
    const intent = /\b(quero|queria|gostaria|procuro|busco|preciso|tenho interesse|tem|teria|possuem|possui|vendem|vende|comprar|valor|preco|quanto custa|mostrar|ver)\b/.test(text);
    const detail = /\b\d+(?:\.\d+)?\s*(?:mm|cm)\b/.test(text) || /\b(ouro|18k|10k|14k|prata|925|semijoia|banhada|banhado|folheada|folheado)\b/.test(text);
    const shortSpecific = text.split(" ").length <= 7;

    if(!(product || model || namedModel)) return null;
    if(!intent && !detail && !(model && shortSpecific) && !(product && shortSpecific)) return null;

    const query = buildSearchQuery(text, product, model || namedModel);
    if(!query) return null;
    return {text, product, model:model || namedModel || null, query};
  }

  function searchUrl(query){
    return `${SEARCH_BASE}${encodeURIComponent(query)}`;
  }

  function itemLabel(data){
    if(data.product && data.model) return `${data.product} ${data.model}`;
    return data.product || data.model || data.query;
  }

  function response(data){
    const item = itemLabel(data);
    return `Separei a busca por <strong>${escapeHtml(item)}</strong>. O botão abaixo abre os resultados relacionados a esse modelo no catálogo da loja.`;
  }

  function destination(data){
    const visibleQuery = data.query.length > 45 ? `${data.query.slice(0, 42)}…` : data.query;
    return [{
      url:searchUrl(data.query),
      label:`Ver opções de ${visibleQuery}`
    }];
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
    text.textContent = "Resultados específicos no catálogo:";
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
    await new Promise((resolve) => setTimeout(resolve, 220));
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

  window.__rotaProdutosSiteV1 = {normalize, classify, buildSearchQuery, searchUrl, destination};
})();