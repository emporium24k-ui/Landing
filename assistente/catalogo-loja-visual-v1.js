(() => {
  "use strict";

  const core = window.__coreIntencoesV1;
  const config = window.__EMP24K_CONFIG__;
  const catalog = Array.isArray(window.__CATALOGO_LOJA_EMP24K__) ? window.__CATALOGO_LOJA_EMP24K__ : [];
  if(!core || !config || !catalog.length) return;

  let busy = false;
  const stopwords = new Set([
    "eu","voce","voces","quero","queria","gostaria","procuro","busco","preciso","tem","teria","vende","vendem",
    "comprar","ver","mostrar","mostra","qual","quais","quanto","custa","valor","preco","modelo","estilo","tipo",
    "opcao","opcoes","de","da","do","das","dos","um","uma","uns","umas","em","com","e","ou","para","pra","por"
  ]);

  function money(value){
    return new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(Number(value || 0));
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  }

  function tokens(value){
    return core.normalize(value).split(" ").filter((token) => token && !stopwords.has(token) && token.length > 1);
  }

  function scoreProduct(product, query, queryTokens, entities){
    if(product.category === "alianca") return -100;
    const title = core.normalize(product.title);
    const search = String(product.search || core.normalize(`${product.title} ${product.description || ""}`));
    let score = 0;
    queryTokens.forEach((token) => {
      if(title === token) score += 10;
      else if(title.includes(token)) score += 5;
      else if(search.includes(token)) score += 2;
    });
    if(entities.product && title.includes(core.normalize(entities.product))) score += 5;
    if(entities.model && search.includes(core.normalize(entities.model))) score += 7;
    if(entities.material === "semijoia" && product.category === "semijoia") score += 4;
    if(entities.material?.startsWith("ouro") && search.includes("ouro")) score += 4;
    if(entities.material?.startsWith("prata") && search.includes("prata")) score += 4;
    if(query && search.includes(query)) score += 8;
    return score;
  }

  function findProducts(raw, result){
    const query = core.normalize(raw);
    const queryTokens = tokens(raw);
    return catalog
      .map((product) => ({product, score:scoreProduct(product, query, queryTokens, result.entities || {})}))
      .filter((item) => item.score >= 4)
      .sort((a,b) => b.score - a.score || Number(a.product.price) - Number(b.product.price))
      .slice(0, 5)
      .map((item) => item.product);
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
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

  function searchUrl(raw){
    const route = window.__rotaProdutosSiteV1;
    const result = route?.classify?.(route.normalize(raw));
    if(result?.query && route.searchUrl) return route.searchUrl(result.query);
    return `${config.store.search}${encodeURIComponent(raw)}`;
  }

  function addProductCards(products, raw){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    products.forEach((product) => {
      const card = document.createElement("article");
      card.className = "action-card compact-card";
      card.style.display = "grid";
      card.style.gap = "9px";
      card.style.border = "1px solid rgba(218,176,83,.28)";

      const linkImage = document.createElement("a");
      linkImage.href = product.page;
      linkImage.target = "_blank";
      linkImage.rel = "noopener noreferrer";
      linkImage.style.cssText = "display:block;border-radius:14px;overflow:hidden;background:#fff";
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.title;
      image.loading = "lazy";
      image.decoding = "async";
      image.style.cssText = "display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#fff";
      linkImage.appendChild(image);

      const title = document.createElement("strong");
      title.textContent = product.title;
      title.style.fontSize = "1rem";
      const price = document.createElement("div");
      price.innerHTML = `<strong>${escapeHtml(money(product.price))}</strong><br><small>Valor e disponibilidade atualizados na loja</small>`;
      const open = document.createElement("a");
      open.className = "action-btn store";
      open.href = product.page;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.textContent = "Ver este produto";
      card.append(linkImage, title, price, open);
      messages.appendChild(card);
    });

    const more = document.createElement("div");
    more.className = "action-card compact-card";
    const link = document.createElement("a");
    link.className = "action-btn store";
    link.href = searchUrl(raw);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Ver todos os resultados no site";
    more.appendChild(link);
    messages.appendChild(more);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw, products){
    if(busy) return;
    busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 220));
    addMessage(`Encontrei ${products.length === 1 ? "uma opção relacionada" : `${products.length} opções relacionadas`} ao que você procura. Os valores e a disponibilidade são os atuais da loja online.`);
    addProductCards(products, raw);
    busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;
    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const result = core.classify(raw, window.__coordenadorCentralV1?.state || {});
      if(result.intent !== "ready_product_search") return;
      const products = findProducts(raw, result);
      if(!products.length) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, products);
    }, true);
  });

  window.__catalogoLojaVisualV1 = Object.freeze({findProducts, scoreProduct, catalog});
})();
