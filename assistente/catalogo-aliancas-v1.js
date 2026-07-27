(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const STORE_URL = "https://www.emporium24k.com.br/produtos/";
  const PAGE_SIZE = 5;

  const CATALOG = Object.freeze({
    gold: [
      {id:"gold-atlas", name:"Atlas", material:"Ouro 18k", price:3000, width:"3 mm"},
      {id:"gold-curve", name:"Curve", material:"Ouro 18k", price:3000, width:"2,5 mm"},
      {id:"gold-prime", name:"Prime", material:"Ouro 18k", price:3000, width:"2,5 mm"},
      {id:"gold-vow", name:"Vow", material:"Ouro 18k", price:3000},
      {id:"gold-spark", name:"Spark", material:"Ouro 18k", price:3050, width:"3 mm"},
      {id:"gold-bond", name:"Bond", material:"Ouro 18k", price:4020},
      {id:"gold-eternal", name:"Eternal", material:"Ouro 18k", price:4020},
      {id:"gold-luna", name:"Luna", material:"Ouro 18k", price:4980, width:"4 mm"},
      {id:"gold-horizon", name:"Horizon", material:"Ouro 18k", price:4980, width:"4 mm"},
      {id:"gold-lustre", name:"Lustre", material:"Ouro 18k", price:4980},
      {id:"gold-legacy", name:"Legacy", material:"Ouro 18k", price:4990, width:"4 mm"},
      {id:"gold-flare", name:"Flare", material:"Ouro 18k", price:5000, width:"4 mm", note:"opção com zircônia ou diamante"},
      {id:"gold-aura", name:"Aura", material:"Ouro 18k", price:5580},
      {id:"gold-roots", name:"Roots", material:"Ouro 18k", price:22500, width:"10 mm"},
      {id:"gold-celeste", name:"Celeste", material:"Ouro 18k", price:null, note:"valor confirmado conforme a configuração atual"}
    ],
    silver: [
      {id:"silver-lux", name:"Lux", material:"Prata 925", price:240},
      {id:"silver-gleam", name:"Gleam", material:"Prata 925", price:240},
      {id:"silver-pulse", name:"Pulse", material:"Prata 925", price:240},
      {id:"silver-vow", name:"Vow", material:"Prata 925", price:335},
      {id:"silver-celeste", name:"Celeste", material:"Prata 925", price:336},
      {id:"silver-halo", name:"Halo", material:"Prata 925", price:420},
      {id:"silver-flare", name:"Flare", material:"Prata 925", price:432},
      {id:"silver-lustre", name:"Lustre", material:"Prata 925", price:455},
      {id:"silver-eternal", name:"Eternal", material:"Prata 925", price:480, note:"par com solitário e pedras em zircônia"}
    ]
  });

  const state = {
    busy: false,
    phone: null,
    selected: null,
    awaitingOrderDetails: false,
    personalized: null,
    lastCatalogMaterial: null
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
  const allModels = () => [...CATALOG.gold, ...CATALOG.silver];

  function money(value){
    if(value == null) return "Valor sob confirmação";
    return new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(value);
  }

  function installment(value){
    if(value == null) return "";
    return `10x de ${money(value / 10)} sem juros no catálogo`;
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
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

  function addMessage(html, who = "bot"){
    const messages = document.querySelector("#messages");
    const intro = document.querySelector("#intro");
    if(!messages) return null;
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
    return row;
  }

  function addChoiceButtons(options){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    card.style.display = "grid";
    card.style.gap = "8px";

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `action-btn ${option.kind === "store" ? "store" : "wa"}`;
      button.textContent = option.label;
      Object.entries(option.data || {}).forEach(([key, value]) => {
        button.dataset[key] = value;
      });
      card.appendChild(button);
    });

    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function addStoreButton(label = "Ver joias e semijoias no site"){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card store-card compact-card";
    link.className = "action-btn store";
    link.href = STORE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function commonCatalogText(material){
    const name = material === "gold" ? "ouro 18k" : "prata 925";
    return `Estes são modelos de <strong>${name}</strong> com valores de referência do catálogo atual. As alianças acompanham gravações internas, garantia eterna do teor, caixinha e frete grátis por Sedex. A produção é feita em até 7 dias. Promoções e condições diferentes podem ser confirmadas no fechamento.`;
  }

  function modelDescription(model){
    const details = [];
    if(model.width) details.push(`${model.width} de largura`);
    if(model.note) details.push(model.note);
    return details.join(" · ");
  }

  function addModelCard(model){
    const messages = document.querySelector("#messages");
    if(!messages) return;

    const card = document.createElement("div");
    card.className = "action-card compact-card";
    card.style.display = "grid";
    card.style.gap = "8px";
    card.style.border = "1px solid rgba(218,176,83,.28)";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.gap = "12px";
    header.style.alignItems = "flex-start";

    const title = document.createElement("strong");
    title.textContent = `Modelo ${model.name}`;
    title.style.fontSize = "1rem";

    const material = document.createElement("span");
    material.textContent = model.material;
    material.style.fontSize = ".78rem";
    material.style.opacity = ".78";

    header.append(title, material);

    const price = document.createElement("div");
    price.innerHTML = `<strong>${escapeHtml(money(model.price))}</strong>${model.price != null ? `<br><small>${escapeHtml(installment(model.price))}</small>` : ""}`;

    const description = modelDescription(model);
    card.append(header, price);
    if(description){
      const text = document.createElement("div");
      text.textContent = description;
      text.style.fontSize = ".86rem";
      text.style.opacity = ".86";
      card.appendChild(text);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-btn wa";
    button.textContent = "Quero este modelo";
    button.dataset.ringModel = model.id;
    card.appendChild(button);

    messages.appendChild(card);
  }

  function renderModels(models, material, offset = 0, intro = true){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    if(intro) addMessage(commonCatalogText(material));

    models.slice(offset, offset + PAGE_SIZE).forEach(addModelCard);

    const remaining = models.length - (offset + PAGE_SIZE);
    if(remaining > 0){
      const card = document.createElement("div");
      card.className = "action-card compact-card";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-btn store";
      button.textContent = `Ver mais ${remaining} modelo${remaining === 1 ? "" : "s"}`;
      button.dataset.ringMore = String(offset + PAGE_SIZE);
      button.dataset.ringMaterial = material;
      card.appendChild(button);
      messages.appendChild(card);
    }

    const personal = document.createElement("div");
    personal.className = "action-card compact-card";
    const customButton = document.createElement("button");
    customButton.type = "button";
    customButton.className = "action-btn wa";
    customButton.textContent = "Quero criar uma aliança personalizada";
    customButton.dataset.personalizedMaterial = material;
    personal.appendChild(customButton);
    messages.appendChild(personal);
    messages.scrollTop = messages.scrollHeight;
  }

  function showCatalog(material, models = null){
    state.lastCatalogMaterial = material;
    renderModels(models || CATALOG[material], material, 0, true);
  }

  function showMaterialChoices(){
    addChoiceButtons([
      {label:"Ver alianças em ouro 18k", data:{ringCatalog:"gold"}},
      {label:"Ver alianças em prata 925", data:{ringCatalog:"silver"}},
      {label:"Criar uma aliança personalizada", data:{personalizedMaterial:"choose"}},
      {label:"Ver joias e semijoias", kind:"store", data:{openStore:"1"}}
    ]);
  }

  function findModels(text){
    const matches = allModels().filter((model) => {
      const name = normalize(model.name);
      return new RegExp(`(?:^|\\s)${name}(?:\\s|$)`).test(text);
    });

    const gold = /\b(ouro|18k|ouro 18k)\b/.test(text);
    const silver = /\b(prata|925|prata 925)\b/.test(text);
    let filtered = matches;
    if(gold && !silver) filtered = matches.filter((model) => model.material === "Ouro 18k");
    if(silver && !gold) filtered = matches.filter((model) => model.material === "Prata 925");
    return filtered;
  }

  function widthFrom(text){
    const match = text.match(/\b(2\.5|3|4|5|6|7|8|9|10)\s*mm\b/);
    return match ? match[1].replace(".", ",") + " mm" : null;
  }

  function specificByWidth(text){
    const width = widthFrom(text);
    if(!width) return [];
    const material = /\b(prata|925)\b/.test(text) ? "silver" : /\b(ouro|18k)\b/.test(text) ? "gold" : null;
    if(!material) return [];
    return CATALOG[material].filter((model) => model.width === width);
  }

  function isBlockedValueContext(text){
    return includesAny(text, [
      "quanto pagam", "vender ouro", "vender prata", "avaliar ouro", "avaliar prata",
      "cotacao do ouro", "preco do ouro por grama", "valor da grama", "grama do ouro",
      "valor do frete", "valor da entrega", "valor do conserto", "valor do polimento",
      "valor da mao de obra", "quanto fica a mao de obra", "valor da parcela"
    ]);
  }

  function isValueQuestion(text){
    if(isBlockedValueContext(text)) return false;
    return /\b(valor|valores|preco|precos|quanto custa|quanto fica|custa quanto|qual o valor|qual valor)\b/.test(text);
  }

  function isCatalogRequest(text){
    const alliance = /\b(alianca|aliancas|aliansa|aliansas|alinca|alincas)\b/.test(text);
    const browse = /\b(modelo|modelos|catalogo|opcoes|ver|mostrar|mostra|conhecer|escolher|tem|quero)\b/.test(text);
    return alliance && browse;
  }

  function isPersonalizedRequest(text){
    const alliance = /\b(alianca|aliancas|aliansa|aliansas|alinca|alincas)\b/.test(text);
    const custom = includesAny(text, [
      "personalizada", "personalizado", "personalizar", "do meu jeito", "modelo proprio",
      "minha ideia", "ideia de alianca", "criar uma alianca", "desenhar uma alianca",
      "igual a foto", "igual uma foto", "por foto", "sob medida", "exclusiva", "exclusivo"
    ]);
    return alliance && custom;
  }

  function readyProductValue(text){
    const products = /\b(joia|joias|semijoia|semijoias|corrente|correntes|colar|colares|pulseira|pulseiras|brinco|brincos|pingente|pingentes|tornozeleira|tornozeleiras)\b/.test(text);
    return products && isValueQuestion(text);
  }

  function broadValueOnly(text){
    const compact = text.replace(/\b(por favor|pfv|pra mim|para mim)\b/g, "").trim();
    return /^(qual (e )?o? ?valor|qual valor|quanto custa|quanto fica|preco|valores|quais os valores)$/.test(compact);
  }

  function classify(text){
    if(!text || text.length > 320) return null;

    if(state.awaitingOrderDetails){
      if(shouldReleaseContext(text)){
        state.awaitingOrderDetails = false;
        state.selected = null;
        return null;
      }
      return {type:"order_details", raw:text};
    }

    if(state.personalized?.stage === "idea"){
      if(shouldReleaseContext(text)){
        state.personalized = null;
        return null;
      }
      return {type:"personalized_idea", raw:text};
    }

    if(state.personalized?.stage === "sizes"){
      if(shouldReleaseContext(text)){
        state.personalized = null;
        return null;
      }
      return {type:"personalized_sizes", raw:text};
    }

    if(isPersonalizedRequest(text)){
      const material = /\b(ouro|18k)\b/.test(text) ? "gold" : /\b(prata|925)\b/.test(text) ? "silver" : null;
      return {type:"personalized_start", material};
    }

    const modelMatches = findModels(text);
    if(modelMatches.length && (isValueQuestion(text) || isCatalogRequest(text) || /\b(tem|quero|gostaria|interesse)\b/.test(text))){
      return {type:"models", models:modelMatches};
    }

    const byWidth = specificByWidth(text);
    if(byWidth.length && isValueQuestion(text)) return {type:"models", models:byWidth};

    if(broadValueOnly(text)) return {type:"value_broad"};

    if(isValueQuestion(text)){
      const hasAlliance = /\b(alianca|aliancas|aliansa|aliansas|alinca|alincas)\b/.test(text);
      if(hasAlliance){
        if(/\b(ouro|18k)\b/.test(text)) return {type:"catalog", material:"gold", value:true};
        if(/\b(prata|925)\b/.test(text)) return {type:"catalog", material:"silver", value:true};
        return {type:"value_alliances"};
      }
      if(readyProductValue(text)) return {type:"value_store"};
      return {type:"value_broad"};
    }

    if(isCatalogRequest(text)){
      if(/\b(ouro|18k)\b/.test(text)) return {type:"catalog", material:"gold"};
      if(/\b(prata|925)\b/.test(text)) return {type:"catalog", material:"silver"};
      return {type:"catalog_choose"};
    }

    return null;
  }

  function shouldReleaseContext(text){
    return includesAny(text, [
      "garantia", "pagamento", "pix", "cartao", "boleto", "parcela", "frete", "sedex",
      "entrega", "rastreio", "endereco", "loja fisica", "polimento", "conserto",
      "vender ouro", "vender prata", "nota fiscal", "certificado", "prazo"
    ]);
  }

  function broadValueResponse(){
    return `Os valores dependem do tipo de peça. No catálogo atual, os pares de alianças em <strong>prata 925</strong> começam em <strong>${money(240)}</strong>; os modelos em <strong>ouro 18k</strong> começam em <strong>${money(3000)}</strong> e aumentam conforme largura, peso, pedras e acabamento. Joias e semijoias variam conforme o modelo disponível. Já uma peça personalizada é calculada pela ideia, material, medidas e pedras. Escolha uma opção abaixo para eu mostrar os valores certos.`;
  }

  function allianceValueResponse(){
    return `Para alianças, o material muda bastante o orçamento: os pares em <strong>prata 925</strong> começam em <strong>${money(240)}</strong>, enquanto os pares em <strong>ouro 18k</strong> começam em <strong>${money(3000)}</strong>. Modelos mais largos, com pedras ou personalizados têm valores maiores. Posso mostrar os modelos e valores aqui mesmo.`;
  }

  function personalizedStart(material){
    if(material){
      const label = material === "gold" ? "ouro 18k" : "prata 925";
      state.personalized = {stage:"idea", material, idea:"", sizes:""};
      addMessage(`Adorei a ideia! ✨ Vamos criar uma aliança personalizada em <strong>${label}</strong>. Me conte como você imagina o modelo: largura, formato, acabamento, pedras, detalhes e gravação. Pode explicar com suas palavras ou dizer que possui uma foto de referência.`);
      return;
    }

    addMessage("Que ideia incrível! ✨ Fazemos alianças personalizadas e podemos desenvolver o projeto a partir de uma descrição, desenho ou foto de referência. Primeiro, qual material você prefere?");
    addChoiceButtons([
      {label:"Personalizada em ouro 18k", data:{personalizedMaterial:"gold"}},
      {label:"Personalizada em prata 925", data:{personalizedMaterial:"silver"}},
      {label:"Ainda não decidi o material", data:{personalizedMaterial:"undecided"}}
    ]);
  }

  function personalizedIdea(raw){
    state.personalized.idea = raw;
    state.personalized.stage = "sizes";
    const material = state.personalized.material === "gold" ? "ouro 18k" : state.personalized.material === "silver" ? "prata 925" : "material a definir";
    addMessage(`Sua ideia ficou muito interessante! 👑 Anotei o projeto em <strong>${material}</strong>: “${escapeHtml(raw)}”. Para deixar a solicitação pronta, quais são as numerações dos dois aros? Caso ainda não saiba, pode responder “ainda não sei”.`);
  }

  function personalizedSizes(raw){
    state.personalized.sizes = raw;
    const summary = personalizedSummary();
    addMessage(`Perfeito! Organizei sua solicitação:<br><strong>${escapeHtml(summary)}</strong><br>A equipe poderá analisar a viabilidade, calcular o valor e orientar os próximos passos sem você precisar explicar tudo novamente.`);
    addWhatsAppButton("Enviar projeto personalizado", summary);
    state.personalized = null;
  }

  function personalizedSummary(){
    const p = state.personalized;
    const material = p.material === "gold" ? "Ouro 18k" : p.material === "silver" ? "Prata 925" : "Material a definir";
    return `Aliança personalizada | Material: ${material} | Ideia: ${p.idea} | Aros: ${p.sizes}`;
  }

  function selectModel(model){
    state.selected = model;
    state.awaitingOrderDetails = true;
    const detail = modelDescription(model);
    addMessage(`Ótima escolha! 👑 Você selecionou o modelo <strong>${escapeHtml(model.name)}</strong> em <strong>${escapeHtml(model.material)}</strong>, por <strong>${escapeHtml(money(model.price))}</strong>${detail ? ` (${escapeHtml(detail)})` : ""}. Para deixar o pedido pronto, envie as duas numerações e a gravação desejada. Exemplo: “aros 17 e 25, Ana & Lucas, 12/10”. Caso ainda não saiba as medidas, pode dizer isso.`);
    addChoiceButtons([
      {label:"Ainda não sei as numerações", data:{ringUnknownSizes:"1"}}
    ]);
  }

  function completeOrder(raw){
    const model = state.selected;
    const summary = `${model.name} | ${model.material} | Referência: ${money(model.price)} | Detalhes informados: ${raw}`;
    addMessage(`Perfeito! Seu interesse ficou organizado:<br><strong>${escapeHtml(summary)}</strong><br>Agora o atendimento consegue confirmar numerações, promoção vigente, prazo e fechamento com muito mais rapidez.`);
    addWhatsAppButton("Continuar com este modelo", summary);
    state.selected = null;
    state.awaitingOrderDetails = false;
  }

  function whatsappUrl(summary){
    const message = `Olá! Vim pela Coroa 24K e já escolhi minha aliança.\n\n${summary}`;
    return `https://api.whatsapp.com/send/?phone=${choosePhone()}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  function addWhatsAppButton(label, summary){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    link.className = "action-btn wa";
    link.href = whatsappUrl(summary);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw, result){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 240));

    switch(result.type){
      case "value_broad":
        addMessage(broadValueResponse());
        showMaterialChoices();
        break;
      case "value_alliances":
        addMessage(allianceValueResponse());
        showMaterialChoices();
        break;
      case "value_store":
        addMessage("O valor de joias e semijoias depende do material, tamanho, espessura e modelo. As peças disponíveis têm fotos, valores e estoque atualizados na loja online. Para alianças, consigo mostrar os modelos e valores aqui na conversa.");
        addStoreButton();
        break;
      case "catalog_choose":
        addMessage("Claro! Posso mostrar os modelos aqui mesmo. Você quer ver alianças em ouro 18k, prata 925 ou prefere criar uma personalizada?");
        showMaterialChoices();
        break;
      case "catalog":
        if(result.value){
          const list = CATALOG[result.material].filter((model) => model.price != null);
          const prices = list.map((model) => model.price);
          addMessage(`Os modelos em <strong>${result.material === "gold" ? "ouro 18k" : "prata 925"}</strong> começam em <strong>${money(Math.min(...prices))}</strong>. Vou mostrar as opções com os valores de referência do catálogo atual.`);
        }
        showCatalog(result.material);
        break;
      case "models": {
        const material = result.models[0]?.material === "Prata 925" ? "silver" : "gold";
        addMessage(result.models.length > 1
          ? "Encontrei mais de uma opção com esse nome ou especificação. Veja as alternativas para escolher a correta:"
          : "Encontrei o modelo correspondente. Veja os detalhes:");
        renderModels(result.models, material, 0, false);
        break;
      }
      case "personalized_start":
        personalizedStart(result.material);
        break;
      case "personalized_idea":
        personalizedIdea(raw);
        break;
      case "personalized_sizes":
        personalizedSizes(raw);
        break;
      case "order_details":
        completeOrder(raw);
        break;
      default:
        break;
    }

    state.busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    const messages = document.querySelector("#messages");
    if(!form || !input || !messages) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const result = classify(normalize(raw));
      if(!result) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, result);
    }, true);

    messages.addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if(!target) return;

      if(target.dataset.openStore){
        window.open(STORE_URL, "_blank", "noopener,noreferrer");
        return;
      }

      if(target.dataset.ringCatalog){
        const material = target.dataset.ringCatalog;
        addMessage(material === "gold" ? "Quero ver alianças em ouro 18k" : "Quero ver alianças em prata 925", "user");
        showCatalog(material);
        return;
      }

      if(target.dataset.ringMore){
        const material = target.dataset.ringMaterial;
        const offset = Number(target.dataset.ringMore || 0);
        renderModels(CATALOG[material], material, offset, false);
        target.closest(".action-card")?.remove();
        return;
      }

      if(target.dataset.ringModel){
        const model = allModels().find((item) => item.id === target.dataset.ringModel);
        if(model) selectModel(model);
        return;
      }

      if(target.dataset.ringUnknownSizes){
        if(!state.selected) return;
        completeOrder("Ainda não sei as numerações nem a gravação");
        return;
      }

      if(target.dataset.personalizedMaterial){
        const material = target.dataset.personalizedMaterial;
        if(material === "choose"){
          personalizedStart(null);
          return;
        }
        state.personalized = {
          stage:"idea",
          material: material === "undecided" ? null : material,
          idea:"",
          sizes:""
        };
        const label = material === "gold" ? "ouro 18k" : material === "silver" ? "prata 925" : "material a definir";
        addMessage(`Perfeito! Vamos desenvolver a ideia com <strong>${label}</strong>. Me conte como você imagina a aliança: largura, acabamento, pedras, detalhes e gravação. Também pode dizer que possui uma foto de referência.`);
      }
    });
  });

  window.__catalogoAliancasV1 = {CATALOG, normalize, classify, state, findModels, specificByWidth};
})();