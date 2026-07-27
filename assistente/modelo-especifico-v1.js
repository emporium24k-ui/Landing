(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const state = {
    activeUntil: 0,
    messages: [],
    busy: false,
    phone: null,
    lastReply: -1
  };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  const productMap = [
    [/(?:^|\s)aliancas?(?:\s|$)/, "aliança"],
    [/(?:^|\s)aneis?(?:\s|$)/, "anel"],
    [/(?:^|\s)solitarios?(?:\s|$)/, "solitário"],
    [/(?:^|\s)aparadores?(?:\s|$)/, "aparador"],
    [/(?:^|\s)correntes?(?:\s|$)/, "corrente"],
    [/(?:^|\s)cordoes?(?:\s|$)/, "cordão"],
    [/(?:^|\s)colares?(?:\s|$)/, "colar"],
    [/(?:^|\s)pulseiras?(?:\s|$)/, "pulseira"],
    [/(?:^|\s)pingentes?(?:\s|$)/, "pingente"],
    [/(?:^|\s)brincos?(?:\s|$)/, "brinco"],
    [/(?:^|\s)tornozeleiras?(?:\s|$)/, "tornozeleira"]
  ];

  const modelMap = [
    ["elo portugues", "elo português"],
    ["cordao baiano", "cordão baiano"],
    ["rabo de rato", "rabo de rato"],
    ["grummet", "grumet"],
    ["groumet", "grumet"],
    ["grumet", "grumet"],
    ["cartier", "Cartier"],
    ["veneziana", "veneziana"],
    ["singapura", "singapura"],
    ["piastrine", "piastrine"],
    ["figaro", "figaro"],
    ["cubana", "cubana"],
    ["cadeado", "cadeado"],
    ["baiana", "baiana"]
  ];

  const finishMap = [
    ["semi anatomica", "interna semianatômica"],
    ["semianatomica", "interna semianatômica"],
    ["anatomica", "interna anatômica"],
    ["chanfrada", "chanfrada"],
    ["chanfrado", "chanfrada"],
    ["diamantada", "diamantada"],
    ["diamantado", "diamantada"],
    ["fosca", "fosca"],
    ["fosco", "fosca"],
    ["polida", "polida"],
    ["polido", "polida"],
    ["concava", "côncava"],
    ["abaulada", "abaulada"],
    ["quadrada", "quadrada"],
    ["reta", "reta"]
  ];

  function firstMapped(text, map){
    for(const [key, label] of map){
      if(typeof key === "string" ? text.includes(key) : key.test(text)) return label;
    }
    return null;
  }

  function parse(text){
    const measurements = [];
    const measurementRegex = /\b(\d+(?:\.\d+)?)\s*(mm|cm)\b/g;
    let match;
    while((match = measurementRegex.exec(text))){
      const number = match[1].replace(".", ",");
      const label = `${number} ${match[2]}`;
      if(!measurements.includes(label)) measurements.push(label);
    }

    const aroMatch = text.match(/\baro\s*(\d{1,2})\b/);
    const material = includesAny(text, ["ouro 18k", "ouro dezoito", "18k"])
      ? "ouro 18k"
      : includesAny(text, ["prata 925", "925"])
        ? "prata 925"
        : /\bouro\b/.test(text)
          ? "ouro"
          : /\bprata\b/.test(text)
            ? "prata"
            : includesAny(text, ["semijoia", "semi joia", "banhada", "banhado"])
              ? "semijoia"
              : null;

    const stone = firstMapped(text, [
      ["diamante", "com diamante"], ["zirconia", "com zircônia"],
      ["safira", "com safira"], ["esmeralda", "com esmeralda"],
      ["rubi", "com rubi"], ["ametista", "com ametista"]
    ]);

    return {
      product: firstMapped(text, productMap),
      model: firstMapped(text, modelMap),
      finish: firstMapped(text, finishMap),
      measurements,
      aro: aroMatch ? aroMatch[1] : null,
      material,
      stone,
      gender: /\bmasculin[oa]\b/.test(text) ? "masculina" : /\bfeminin[oa]\b/.test(text) ? "feminina" : null
    };
  }

  function isBlocked(text){
    return includesAny(text, [
      "polimento", "polir", "conserto", "consertar", "reparar", "quebrou", "quebrada", "quebrado",
      "quero vender", "gostaria de vender", "avaliar meu", "avaliacao do meu", "compram meu",
      "rastreio", "rastreamento", "codigo de rastreio", "garantia", "nota fiscal", "certificado",
      "frete", "sedex", "entrega", "pagamento", "pix", "boleto", "cartao", "maquininha",
      "encapada", "meu ouro", "ouro do cliente", "abater no valor", "parte do pagamento",
      "personalizada", "personalizado", "sob medida", "do meu jeito", "igual a foto", "a partir de um desenho"
    ]);
  }

  function hasPurchaseIntent(text){
    return /\b(quero|queria|gostaria|procuro|busco|preciso|tenho interesse|orcamento|valor|preco|quanto custa|tem|teria|vendem|fazem)\b/.test(text);
  }

  function isSpecificInitial(text, parsed){
    if(!text || text.length > 220 || isBlocked(text)) return false;

    const hasDimension = parsed.measurements.length > 0 || Boolean(parsed.aro);
    const extraCount = [parsed.model, parsed.material, parsed.finish, parsed.stone, hasDimension].filter(Boolean).length;
    const intent = hasPurchaseIntent(text);

    if(parsed.model && (intent || hasDimension || parsed.product)) return true;
    if(parsed.product && intent && extraCount >= 1) return true;
    if(parsed.product && extraCount >= 2) return true;
    return false;
  }

  function contextActive(){
    if(state.messages.length && Date.now() <= state.activeUntil) return true;
    state.messages = [];
    state.activeUntil = 0;
    return false;
  }

  function changedSubject(text){
    return includesAny(text, [
      "rastreio", "rastreamento", "garantia", "nota fiscal", "certificado", "endereco", "onde fica",
      "frete", "sedex", "entrega", "pix", "boleto", "cartao", "pagamento", "parcelas", "juros",
      "polimento", "polir", "conserto", "consertar", "vender ouro", "vender prata", "avaliar meu ouro"
    ]);
  }

  function isFollowUp(text, parsed){
    if(!contextActive()) return false;
    if(changedSubject(text)){
      state.messages = [];
      state.activeUntil = 0;
      return false;
    }

    const detail = parsed.product || parsed.model || parsed.material || parsed.finish || parsed.stone ||
      parsed.aro || parsed.measurements.length || includesAny(text, [
        "quanto custa", "qual o valor", "tem disponivel", "consegue fazer", "seria", "quero essa",
        "masculina", "feminina", "sim", "isso", "exatamente"
      ]);
    return Boolean(detail) && text.length <= 180;
  }

  function humanList(items){
    const clean = items.filter(Boolean);
    if(clean.length <= 1) return clean[0] || "";
    if(clean.length === 2) return `${clean[0]} e ${clean[1]}`;
    return `${clean.slice(0, -1).join(", ")} e ${clean[clean.length - 1]}`;
  }

  function describe(parsed){
    let base = parsed.product || "peça";
    if(parsed.model) base += ` modelo ${parsed.model}`;

    const details = [];
    if(parsed.material) details.push(`em ${parsed.material}`);
    details.push(...parsed.measurements);
    if(parsed.aro) details.push(`aro ${parsed.aro}`);
    if(parsed.finish) details.push(parsed.finish);
    if(parsed.stone) details.push(parsed.stone);
    if(parsed.gender) details.push(parsed.gender);

    return details.length ? `${base}, ${humanList(details)}` : base;
  }

  function missingDetails(parsed){
    const missing = [];
    const chainModel = ["grumet", "Cartier", "veneziana", "singapura", "piastrine", "figaro", "cubana", "cadeado", "cordão baiano", "elo português", "rabo de rato", "baiana"].includes(parsed.model);

    if(chainModel && !parsed.product) missing.push("se seria corrente ou pulseira");
    if(!parsed.material) missing.push("o material desejado");

    if(["corrente", "cordão", "colar", "pulseira", "tornozeleira"].includes(parsed.product) || (chainModel && !parsed.product)){
      if(!parsed.measurements.some((item) => item.endsWith("cm"))) missing.push("o comprimento");
    }

    if(["aliança", "anel", "solitário", "aparador"].includes(parsed.product) && !parsed.aro){
      missing.push("a numeração do aro");
    }

    return missing.slice(0, 3);
  }

  function choosePhone(){
    if(state.phone) return state.phone;
    try{
      const saved = sessionStorage.getItem("coroa24kSalesPhone");
      if(SALES.includes(saved)) return state.phone = saved;
      const data = new Uint32Array(1);
      crypto.getRandomValues(data);
      state.phone = SALES[data[0] % SALES.length];
      sessionStorage.setItem("coroa24kSalesPhone", state.phone);
    }catch(_){
      state.phone = SALES[Math.random() < 0.5 ? 0 : 1];
    }
    return state.phone;
  }

  function whatsappUrl(){
    const completeRequest = state.messages.join("\nDetalhes adicionais: ");
    const message = `Olá! Tenho interesse em um modelo específico. Minha solicitação: ${completeRequest}`;
    return `https://api.whatsapp.com/send/?phone=${choosePhone()}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
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

  function addButton(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    link.className = "action-btn wa";
    link.href = whatsappUrl();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Consultar este modelo";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function responseFor(parsed, followUp){
    const summary = describe(parsed);
    const missing = missingDetails(parsed);
    const openings = followUp
      ? ["Perfeito! Atualizei sua solicitação", "Ótimo, agora ficou ainda mais claro", "Excelente, anotei esse detalhe"]
      : ["Ótima escolha! Entendi sua procura", "Excelente escolha! Você já trouxe os principais detalhes", "Perfeito! Esse é um pedido bem específico"];

    let index;
    do index = Math.floor(Math.random() * openings.length);
    while(index === state.lastReply && openings.length > 1);
    state.lastReply = index;

    if(missing.length){
      return `${openings[index]}: <strong>${escapeHtml(summary)}</strong>. Para direcionar o orçamento certinho, falta só confirmar ${escapeHtml(humanList(missing))}. Já deixei sua solicitação pronta para o vendedor.`;
    }

    return `${openings[index]}: <strong>${escapeHtml(summary)}</strong>. Com essas informações, a equipe já consegue verificar disponibilidade ou produção, valor e prazo com precisão.`;
  }

  async function answer(raw, followUp){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";

    if(!followUp) state.messages = [raw];
    else state.messages.push(raw);
    state.activeUntil = Date.now() + 10 * 60 * 1000;

    const combined = normalize(state.messages.join(" "));
    const parsed = parse(combined);

    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 240));
    addMessage(responseFor(parsed, followUp));
    addButton();

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
      const parsed = parse(text);
      const followUp = isFollowUp(text, parsed);
      const initial = !followUp && isSpecificInitial(text, parsed);
      if(!followUp && !initial) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, followUp);
    }, true);
  });

  window.__modeloEspecificoV1 = {normalize, parse, isSpecificInitial, isFollowUp, missingDetails, state};
})();