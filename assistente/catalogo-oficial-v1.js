(() => {
  "use strict";

  const IMAGE_BUILD = "20260728-59";
  const OFFICIAL = window.__CATALOGO_OFICIAL_EMP24K__ || {};
  const catalogApi = window.__catalogoAliancasV1;
  if(!catalogApi?.CATALOG) return;

  const byId = new Map();
  [...catalogApi.CATALOG.gold, ...catalogApi.CATALOG.silver].forEach((model) => {
    const official = OFFICIAL[model.id];
    if(official){
      if(Number.isFinite(Number(official.price)) && Number(official.price) > 0){
        model.price = Number(official.price);
      }
      if(official.width) model.width = official.width;
      if(official.image) model.image = official.image;
      if(official.image_source) model.imageSource = official.image_source;
      if(official.page) model.page = official.page;
      if(official.description) model.officialDescription = official.description;

      const description = String(official.description || "").toLowerCase();
      if(description.includes("zircônia ou diamante") || description.includes("zirconia ou diamante")){
        model.note = "pedra de zircônia ou diamante";
      }else if(description.includes("com solitário") || description.includes("com solitario")){
        model.note = model.note || "par com solitário";
      }else if(description.includes("cravejadas em zircônia") || description.includes("cravejadas em zirconia")){
        model.note = model.note || "cravejadas em zircônia";
      }
    }
    byId.set(model.id, model);
  });

  function absoluteImageUrl(value, cacheBust = false){
    if(!value) return "";
    try{
      const url = new URL(value, document.baseURI);
      if(cacheBust && url.origin === window.location.origin) url.searchParams.set("v", IMAGE_BUILD);
      return url.toString();
    }catch(_){
      return String(value);
    }
  }

  function imageSources(model){
    return [...new Set([
      absoluteImageUrl(model?.image, true),
      absoluteImageUrl(model?.imageSource, false)
    ].filter(Boolean))];
  }

  function ensureModal(){
    let modal = document.querySelector("#officialRingImageModal");
    if(modal) return modal;
    modal = document.createElement("div");
    modal.id = "officialRingImageModal";
    modal.style.cssText = "display:none;position:fixed;inset:0;z-index:10000;place-items:center;padding:16px;background:rgba(0,0,0,.88);backdrop-filter:blur(5px)";
    modal.innerHTML = `
      <div role="dialog" aria-modal="true" aria-label="Imagem ampliada da aliança" style="width:min(640px,100%);background:#0d1b13;border:1px solid rgba(218,176,83,.38);border-radius:18px;padding:12px;box-shadow:0 24px 70px rgba(0,0,0,.58)">
        <button type="button" data-close-official-ring-image style="display:block;margin-left:auto;border:0;background:transparent;color:#f5df98;font-size:1.8rem;padding:2px 8px;cursor:pointer" aria-label="Fechar imagem">×</button>
        <img data-official-ring-modal-image alt="" style="display:block;width:100%;max-height:74vh;object-fit:contain;border-radius:14px;background:#fff" />
        <div data-official-ring-modal-title style="padding:11px 5px 4px;color:#f5df98;font-weight:700;text-align:center"></div>
      </div>`;
    const close = () => {
      modal.style.display = "none";
      document.body.style.overflow = "";
    };
    modal.addEventListener("click", (event) => {
      if(event.target === modal || event.target.closest("[data-close-official-ring-image]")) close();
    });
    document.addEventListener("keydown", (event) => {
      if(event.key === "Escape" && modal.style.display !== "none") close();
    });
    document.body.appendChild(modal);
    return modal;
  }

  function openModal(model, source){
    if(!source) return;
    const modal = ensureModal();
    const image = modal.querySelector("[data-official-ring-modal-image]");
    image.src = source;
    image.alt = `Aliança modelo ${model.name}`;
    modal.querySelector("[data-official-ring-modal-title]").textContent = `Modelo ${model.name}`;
    modal.style.display = "grid";
    document.body.style.overflow = "hidden";
  }

  function makeImage(model){
    const sources = imageSources(model);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.officialCatalogImage = model.id;
    button.setAttribute("aria-label", `Ampliar foto do modelo ${model.name}`);
    button.style.cssText = "display:grid;width:100%;min-height:190px;padding:0;border:1px solid rgba(218,176,83,.26);border-radius:14px;overflow:hidden;background:#fff;place-items:center;cursor:zoom-in";

    const status = document.createElement("span");
    status.textContent = `Carregando foto do modelo ${model.name}…`;
    status.style.cssText = "padding:22px;color:#473719;font-size:.84rem;text-align:center";

    const image = document.createElement("img");
    image.alt = `Aliança modelo ${model.name} — foto oficial Emporium24k`;
    image.loading = "eager";
    image.decoding = "async";
    image.style.cssText = "display:none;width:100%;height:clamp(210px,58vw,360px);object-fit:contain;background:#fff";

    let sourceIndex = 0;
    let activeSource = "";
    const showFallback = () => {
      image.remove();
      status.innerHTML = `<strong>Modelo ${model.name}</strong><br><small>Toque para abrir a página oficial</small>`;
      button.style.cssText += ";background:linear-gradient(135deg,rgba(218,176,83,.16),rgba(8,24,16,.96));color:#f3dda0";
      button.dataset.imageFallback = "1";
    };
    const tryNext = () => {
      if(sourceIndex >= sources.length){
        showFallback();
        return;
      }
      activeSource = sources[sourceIndex++];
      image.src = activeSource;
    };

    image.addEventListener("load", () => {
      status.remove();
      image.style.display = "block";
      button.dataset.imageLoaded = "1";
    });
    image.addEventListener("error", tryNext);

    button.append(status, image);
    button.addEventListener("click", () => {
      if(button.dataset.imageLoaded === "1") openModal(model, activeSource);
      else if(model.page) window.open(model.page, "_blank", "noopener,noreferrer");
    });
    tryNext();
    return button;
  }

  function refreshVisibleDetails(card, model){
    const strongs = [...card.querySelectorAll("strong")];
    const price = strongs.find((item) => /^R\$|^Valor sob confirmação/i.test(item.textContent.trim()));
    if(price && Number.isFinite(model.price)){
      price.textContent = new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(model.price);
      const small = price.parentElement?.querySelector("small");
      if(small) small.textContent = `10x de ${new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(model.price / 10)} sem juros no catálogo`;
    }

    if(model.id === "gold-celeste"){
      const generic = [...card.querySelectorAll("div")].find((item) => item.childElementCount === 0 && /valor confirmado conforme/i.test(item.textContent));
      if(generic) generic.textContent = "3 mm de largura · pedra de zircônia ou diamante";
    }
  }

  function decorate(card){
    if(!(card instanceof HTMLElement)) return;
    const select = card.querySelector("button[data-ring-model]");
    if(!select) return;
    const model = byId.get(select.dataset.ringModel);
    if(!model) return;

    refreshVisibleDetails(card, model);
    if(card.querySelector("[data-official-catalog-image]")) return;
    card.querySelectorAll(".ring-photo-button,.ring-photo-placeholder,[data-ring-photo-v2],[data-catalog-photo-v3]").forEach((item) => item.remove());
    card.insertBefore(makeImage(model), card.firstChild);
    card.dataset.officialCatalogReady = "1";
  }

  function scan(root = document){
    if(root.matches?.(".action-card")) decorate(root);
    root.querySelectorAll?.("#messages .action-card").forEach(decorate);
  }

  function boot(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    ensureModal();
    scan(document);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if(node instanceof HTMLElement) scan(node);
      }));
    });
    observer.observe(messages, {childList:true, subtree:true});
    document.addEventListener("click", () => requestAnimationFrame(() => scan(document)), true);
    document.addEventListener("submit", () => requestAnimationFrame(() => scan(document)), true);
    [100, 350, 800, 1600, 3000].forEach((delay) => setTimeout(() => scan(document), delay));
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();

  window.__catalogoOficialV1 = {OFFICIAL, byId, scan, imageSources, build:IMAGE_BUILD};
})();