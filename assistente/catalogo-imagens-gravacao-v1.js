(() => {
  "use strict";

  const PRODUCTS = Object.freeze({
    "gold-atlas": {
      name: "Atlas",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-1erog/"
    },
    "gold-curve": {
      name: "Curve",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-4ysq6/"
    },
    "gold-prime": {
      name: "Prime",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-celeste-copia-1s7g4/"
    },
    "gold-vow": {
      name: "Vow",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow/"
    },
    "gold-spark": {
      name: "Spark",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-1fx7u/"
    },
    "gold-bond": {
      name: "Bond",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-bond/"
    },
    "gold-eternal": {
      name: "Eternal",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-eternal/"
    },
    "gold-luna": {
      name: "Luna",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-luna/"
    },
    "gold-horizon": {
      name: "Horizon",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-1kf87/"
    },
    "gold-lustre": {
      name: "Lustre",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-lustre/"
    },
    "gold-legacy": {
      name: "Legacy",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-legacy/"
    },
    "gold-flare": {
      name: "Flare",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-flare/"
    },
    "gold-aura": {
      name: "Aura",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-aura/"
    },
    "gold-roots": {
      name: "Roots",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-22jf3/"
    },
    "gold-celeste": {
      name: "Celeste",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-ouro-celeste/"
    },
    "silver-lux": {
      name: "Lux",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-namoro-lux/"
    },
    "silver-gleam": {
      name: "Gleam",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-namoro-gleam/"
    },
    "silver-pulse": {
      name: "Pulse",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-namoro-pulse/"
    },
    "silver-vow": {
      name: "Vow",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-namoro-vow/"
    },
    "silver-celeste": {
      name: "Celeste",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-namoro-celeste/"
    },
    "silver-halo": {
      name: "Halo",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-namoro-pulse-copia-1h1k0/"
    },
    "silver-flare": {
      name: "Flare",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-namoro-flare/"
    },
    "silver-lustre": {
      name: "Lustre",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-namoro-lustre/"
    },
    "silver-eternal": {
      name: "Eternal",
      page: "https://www.emporium24k.com.br/produtos/alianca-de-namoro-eternal/",
      fallback: "https://dcdn-us.mitiendanube.com/stores/002/194/938/products/3caa63d4-6861-4cd6-93fb-b3fa655aa1b7-6065054060b48ba53e17441630832383-240-0.webp"
    }
  });

  const CATALOG_POLICY = "A gravação gratuita é feita somente na parte interna das alianças, com até 15 caracteres. Acima desse limite ou em uma gravação mais personalizada, também fazemos, mas o valor muda e é calculado conforme o pedido.";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const imageEndpoint = (page) => `https://api.microlink.io/?url=${encodeURIComponent(page)}&embed=image.url`;

  function createPlaceholder(name){
    const placeholder = document.createElement("div");
    placeholder.className = "ring-photo-placeholder";
    placeholder.style.cssText = [
      "display:grid",
      "place-items:center",
      "min-height:210px",
      "padding:20px",
      "border-radius:14px",
      "background:linear-gradient(135deg,rgba(218,176,83,.14),rgba(8,24,16,.95))",
      "border:1px solid rgba(218,176,83,.24)",
      "text-align:center",
      "color:#f3dda0",
      "font-weight:700"
    ].join(";");
    placeholder.innerHTML = `<span style="font-size:2rem;display:block;margin-bottom:8px">♛</span>Modelo ${name}`;
    return placeholder;
  }

  function ensureModal(){
    let modal = document.querySelector("#ringPhotoModal");
    if(modal) return modal;

    modal = document.createElement("div");
    modal.id = "ringPhotoModal";
    modal.hidden = true;
    modal.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:9999",
      "display:grid",
      "place-items:center",
      "padding:20px",
      "background:rgba(0,0,0,.82)",
      "backdrop-filter:blur(5px)"
    ].join(";");

    modal.innerHTML = `
      <div role="dialog" aria-modal="true" aria-label="Foto ampliada da aliança" style="width:min(620px,100%);background:#0d1b13;border:1px solid rgba(218,176,83,.35);border-radius:18px;padding:12px;box-shadow:0 24px 70px rgba(0,0,0,.55)">
        <button type="button" data-close-ring-photo style="display:block;margin-left:auto;border:0;background:transparent;color:#f5df98;font-size:1.7rem;line-height:1;padding:4px 8px;cursor:pointer" aria-label="Fechar imagem">×</button>
        <img data-ring-modal-image alt="" style="display:block;width:100%;max-height:72vh;object-fit:contain;border-radius:14px;background:#fff" />
        <div data-ring-modal-title style="padding:12px 6px 5px;color:#f5df98;font-weight:700;text-align:center"></div>
      </div>`;

    const close = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
    };

    modal.addEventListener("click", (event) => {
      if(event.target === modal || event.target.closest("[data-close-ring-photo]")) close();
    });
    document.addEventListener("keydown", (event) => {
      if(event.key === "Escape" && !modal.hidden) close();
    });

    document.body.appendChild(modal);
    return modal;
  }

  function openModal(src, name){
    const modal = ensureModal();
    const image = modal.querySelector("[data-ring-modal-image]");
    const title = modal.querySelector("[data-ring-modal-title]");
    image.src = src;
    image.alt = `Aliança modelo ${name}`;
    title.textContent = `Modelo ${name}`;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function addProductImage(card){
    if(!(card instanceof HTMLElement) || card.dataset.officialImage === "1") return;
    const modelButton = card.querySelector("button[data-ring-model]");
    if(!modelButton) return;

    const product = PRODUCTS[modelButton.dataset.ringModel];
    if(!product) return;

    const wrapper = document.createElement("button");
    wrapper.type = "button";
    wrapper.className = "ring-photo-button";
    wrapper.setAttribute("aria-label", `Ampliar foto da aliança modelo ${product.name}`);
    wrapper.style.cssText = [
      "display:block",
      "width:100%",
      "padding:0",
      "border:0",
      "border-radius:14px",
      "overflow:hidden",
      "background:rgba(255,255,255,.96)",
      "cursor:zoom-in"
    ].join(";");

    const image = document.createElement("img");
    image.alt = `Aliança modelo ${product.name} — imagem do catálogo oficial Emporium24k`;
    image.loading = "lazy";
    image.decoding = "async";
    image.style.cssText = [
      "display:block",
      "width:100%",
      "aspect-ratio:1/1",
      "object-fit:cover",
      "background:#fff",
      "opacity:0",
      "transition:opacity .2s ease"
    ].join(";");

    let triedFallback = false;
    image.addEventListener("load", () => {
      image.style.opacity = "1";
      wrapper.dataset.loaded = "1";
    });
    image.addEventListener("error", () => {
      if(!triedFallback && product.fallback){
        triedFallback = true;
        image.src = product.fallback;
        return;
      }
      wrapper.replaceWith(createPlaceholder(product.name));
    });

    const source = imageEndpoint(product.page);
    image.src = source;
    wrapper.appendChild(image);
    wrapper.addEventListener("click", () => openModal(image.currentSrc || image.src, product.name));

    card.insertBefore(wrapper, card.firstChild);
    card.dataset.officialImage = "1";
    card.dataset.productPage = product.page;
  }

  function isCatalogBubble(text){
    const normalized = normalize(text);
    if(!normalized) return false;
    return [
      "valores de referencia do catalogo",
      "estes sao modelos de ouro 18k",
      "estes sao modelos de prata 925",
      "encontrei o modelo correspondente",
      "encontrei mais de uma opcao",
      "o modelo",
      "quero o modelo"
    ].some((signal) => normalized.includes(signal));
  }

  function appendCatalogPolicy(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user") || bubble.dataset.engravingPolicy === "1") return;
    if(!isCatalogBubble(bubble.textContent)) return;

    const note = document.createElement("div");
    note.style.cssText = [
      "margin-top:10px",
      "padding-top:9px",
      "border-top:1px solid rgba(218,176,83,.22)",
      "font-size:.9em",
      "line-height:1.45"
    ].join(";");
    note.innerHTML = `<strong>Gravação interna:</strong> ${CATALOG_POLICY}`;
    bubble.appendChild(note);
    bubble.dataset.engravingPolicy = "1";
  }

  function rewriteEngravingQuestion(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user") || bubble.dataset.engravingRewritten === "1") return;
    let html = bubble.innerHTML;

    html = html
      .replace(
        /Você já sabe o que deseja gravar dentro das alianças\?/gi,
        "A gravação gratuita é somente interna e aceita até 15 caracteres. O que você deseja gravar? Acima desse limite ou em algo mais personalizado, também fazemos, mas o valor muda."
      )
      .replace(
        /O que você deseja gravar dentro das alianças\? Pode ser nomes, uma data ou uma frase curta\. Caso ainda não tenha decidido, pode dizer isso\./gi,
        "A gravação gratuita é feita somente na parte interna, com até 15 caracteres. Pode ser nomes, uma data ou uma frase curta. Acima desse limite ou em algo mais personalizado, também fazemos, mas o valor muda. Caso ainda não tenha decidido, pode dizer isso."
      )
      .replace(
        /gravação desejada/gi,
        "gravação interna desejada (até 15 caracteres sem custo)"
      );

    if(html !== bubble.innerHTML) bubble.innerHTML = html;
    bubble.dataset.engravingRewritten = "1";
  }

  function engravingIsUndecided(value){
    const text = normalize(value);
    return !text || [
      "ainda nao decidi a gravacao",
      "nao sei",
      "sem gravacao",
      "prefiro sem gravacao",
      "nenhuma gravacao"
    ].some((item) => text.includes(item));
  }

  function appendFinalEngravingStatus(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user") || bubble.dataset.engravingStatus === "1") return;
    const text = normalize(bubble.textContent);
    if(!text.includes("gravacao") || !(text.includes("ficou assim") || text.includes("recebi estes detalhes") || text.includes("interesse ficou organizado"))) return;

    const flow = window.__catalogoConversaV2?.flow;
    const engraving = String(flow?.engraving || "").trim();
    if(engravingIsUndecided(engraving)){
      bubble.dataset.engravingStatus = "1";
      return;
    }

    const count = Array.from(engraving).length;
    const note = document.createElement("div");
    note.style.cssText = [
      "margin-top:10px",
      "padding:9px 10px",
      "border-radius:10px",
      "background:rgba(218,176,83,.10)",
      "font-size:.9em",
      "line-height:1.45"
    ].join(";");

    if(count <= 15){
      note.innerHTML = `<strong>Gravação:</strong> ${count} caractere${count === 1 ? "" : "s"}, dentro do limite gratuito. Ela será feita somente na parte interna das alianças.`;
    }else{
      note.innerHTML = `<strong>Gravação personalizada:</strong> o texto informado possui ${count} caracteres e ultrapassa o limite gratuito de 15. Conseguimos fazer, mas o valor muda e será calculado conforme o pedido.`;
    }

    bubble.appendChild(note);
    bubble.dataset.engravingStatus = "1";
  }

  function processNode(node){
    if(!(node instanceof HTMLElement)) return;

    if(node.matches(".action-card")) addProductImage(node);
    if(node.matches(".row:not(.user) .bubble")){
      rewriteEngravingQuestion(node);
      appendCatalogPolicy(node);
      appendFinalEngravingStatus(node);
    }

    node.querySelectorAll?.(".action-card").forEach(addProductImage);
    node.querySelectorAll?.(".row:not(.user) .bubble").forEach((bubble) => {
      rewriteEngravingQuestion(bubble);
      appendCatalogPolicy(bubble);
      appendFinalEngravingStatus(bubble);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const messages = document.querySelector("#messages");
    if(!messages) return;

    ensureModal();
    processNode(messages);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(processNode));
    });
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__catalogoImagensGravacaoV1 = {
    PRODUCTS,
    CATALOG_POLICY,
    normalize,
    imageEndpoint
  };
})();