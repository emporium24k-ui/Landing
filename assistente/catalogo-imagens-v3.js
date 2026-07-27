(() => {
  "use strict";

  const VERSION = "20260727-45";
  const PRODUCTS = Object.freeze({
    "gold-atlas": {name:"Atlas", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-1erog/"},
    "gold-curve": {name:"Curve", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-4ysq6/"},
    "gold-prime": {name:"Prime", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-celeste-copia-1s7g4/"},
    "gold-vow": {name:"Vow", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow/"},
    "gold-spark": {name:"Spark", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-1fx7u/"},
    "gold-bond": {name:"Bond", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-bond/"},
    "gold-eternal": {name:"Eternal", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-eternal/"},
    "gold-luna": {name:"Luna", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-luna/"},
    "gold-horizon": {name:"Horizon", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-1kf87/"},
    "gold-lustre": {name:"Lustre", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-lustre/"},
    "gold-legacy": {name:"Legacy", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-legacy/"},
    "gold-flare": {name:"Flare", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-flare/"},
    "gold-aura": {name:"Aura", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-aura/"},
    "gold-roots": {name:"Roots", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-22jf3/"},
    "gold-celeste": {name:"Celeste", page:"https://www.emporium24k.com.br/produtos/alianca-de-ouro-celeste/"},
    "silver-lux": {name:"Lux", page:"https://www.emporium24k.com.br/produtos/alianca-de-namoro-lux/"},
    "silver-gleam": {name:"Gleam", page:"https://www.emporium24k.com.br/produtos/alianca-de-namoro-gleam/"},
    "silver-pulse": {name:"Pulse", page:"https://www.emporium24k.com.br/produtos/alianca-de-namoro-pulse/"},
    "silver-vow": {name:"Vow", page:"https://www.emporium24k.com.br/produtos/alianca-de-namoro-vow/"},
    "silver-celeste": {name:"Celeste", page:"https://www.emporium24k.com.br/produtos/alianca-de-namoro-celeste/"},
    "silver-halo": {name:"Halo", page:"https://www.emporium24k.com.br/produtos/alianca-de-namoro-pulse-copia-1h1k0/"},
    "silver-flare": {name:"Flare", page:"https://www.emporium24k.com.br/produtos/alianca-de-namoro-flare/"},
    "silver-lustre": {name:"Lustre", page:"https://www.emporium24k.com.br/produtos/alianca-de-namoro-lustre/"},
    "silver-eternal": {
      name:"Eternal",
      page:"https://www.emporium24k.com.br/produtos/alianca-de-namoro-eternal/",
      direct:"https://dcdn-us.mitiendanube.com/stores/002/194/938/products/3caa63d4-6861-4cd6-93fb-b3fa655aa1b7-6065054060b48ba53e17441630832383-640-0.webp"
    }
  });

  function candidates(product){
    const page = product.page;
    const list = [];
    if(product.direct) list.push(product.direct);
    list.push(
      `https://api.microlink.io/?url=${encodeURIComponent(page)}&embed=image.url&cache=false&v=${VERSION}`,
      `https://api.microlink.io/?url=${encodeURIComponent(page)}&screenshot=true&embed=screenshot.url&cache=false&v=${VERSION}`,
      `https://image.thum.io/get/width/1000/crop/900/noanimate/wait/4/${page}`,
      `https://s.wordpress.com/mshots/v1/${encodeURIComponent(page)}?w=900&v=${VERSION}`
    );
    return list;
  }

  function ensureModal(){
    let modal = document.querySelector("#ringPhotoModalV3");
    if(modal) return modal;
    modal = document.createElement("div");
    modal.id = "ringPhotoModalV3";
    modal.style.cssText = "display:none;position:fixed;inset:0;z-index:10000;place-items:center;padding:18px;background:rgba(0,0,0,.86);backdrop-filter:blur(5px)";
    modal.innerHTML = `
      <div role="dialog" aria-modal="true" aria-label="Foto ampliada da aliança" style="width:min(640px,100%);background:#0d1b13;border:1px solid rgba(218,176,83,.38);border-radius:18px;padding:12px;box-shadow:0 24px 70px rgba(0,0,0,.58)">
        <button type="button" data-close-photo-v3 style="display:block;margin-left:auto;border:0;background:transparent;color:#f5df98;font-size:1.8rem;padding:2px 8px;cursor:pointer" aria-label="Fechar imagem">×</button>
        <img data-modal-image-v3 alt="" style="display:block;width:100%;max-height:74vh;object-fit:contain;border-radius:14px;background:#fff" />
        <div data-modal-title-v3 style="padding:11px 5px 4px;color:#f5df98;font-weight:700;text-align:center"></div>
      </div>`;
    const close = () => {
      modal.style.display = "none";
      document.body.style.overflow = "";
    };
    modal.addEventListener("click", (event) => {
      if(event.target === modal || event.target.closest("[data-close-photo-v3]")) close();
    });
    document.addEventListener("keydown", (event) => {
      if(event.key === "Escape" && modal.style.display !== "none") close();
    });
    document.body.appendChild(modal);
    return modal;
  }

  function openModal(src, name){
    if(!src) return;
    const modal = ensureModal();
    modal.querySelector("[data-modal-image-v3]").src = src;
    modal.querySelector("[data-modal-image-v3]").alt = `Aliança modelo ${name}`;
    modal.querySelector("[data-modal-title-v3]").textContent = `Modelo ${name}`;
    modal.style.display = "grid";
    document.body.style.overflow = "hidden";
  }

  function createImageBlock(id, product){
    const wrapper = document.createElement("button");
    wrapper.type = "button";
    wrapper.dataset.catalogPhotoV3 = id;
    wrapper.setAttribute("aria-label", `Ampliar foto da aliança modelo ${product.name}`);
    wrapper.style.cssText = "position:relative;display:grid;place-items:center;width:100%;min-height:220px;padding:0;border:1px solid rgba(218,176,83,.28);border-radius:14px;overflow:hidden;background:linear-gradient(135deg,rgba(218,176,83,.16),rgba(8,24,16,.96));cursor:zoom-in";

    const status = document.createElement("div");
    status.style.cssText = "padding:28px 18px;text-align:center;color:#f3dda0;font-weight:700;line-height:1.4";
    status.innerHTML = `<span style="display:block;font-size:2rem;margin-bottom:7px">♛</span>Carregando foto do modelo ${product.name}…`;
    wrapper.appendChild(status);

    const sources = candidates(product);
    let index = 0;
    let loadedSrc = "";

    const tryNext = () => {
      if(index >= sources.length){
        status.innerHTML = `<span style="display:block;font-size:1.8rem;margin-bottom:7px">♛</span>Foto do modelo ${product.name}<br><small style="font-weight:500;opacity:.86">Toque para abrir a imagem na página oficial</small>`;
        wrapper.style.cursor = "pointer";
        wrapper.onclick = () => window.open(product.page, "_blank", "noopener,noreferrer");
        return;
      }

      const src = sources[index++];
      const image = new Image();
      image.alt = `Aliança modelo ${product.name} — imagem oficial Emporium24k`;
      image.loading = "eager";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.style.cssText = "display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#fff";
      image.onload = () => {
        loadedSrc = src;
        wrapper.replaceChildren(image);
        wrapper.dataset.imageLoaded = "1";
        wrapper.onclick = () => openModal(loadedSrc, product.name);
      };
      image.onerror = tryNext;
      image.src = src;
    };

    tryNext();
    return wrapper;
  }

  function enhanceCard(card){
    if(!(card instanceof HTMLElement)) return;
    const modelButton = card.querySelector("button[data-ring-model]");
    if(!modelButton) return;
    const id = modelButton.dataset.ringModel;
    const product = PRODUCTS[id];
    if(!product) return;

    card.querySelectorAll(".ring-photo-button,.ring-photo-placeholder,[data-ring-photo-v2],[data-catalog-photo-v3]").forEach((item) => item.remove());
    card.insertBefore(createImageBlock(id, product), card.firstChild);
    card.dataset.catalogImageV3 = "1";
  }

  function scan(root = document){
    root.querySelectorAll?.("#messages .action-card").forEach((card) => {
      if(card.dataset.catalogImageV3 !== "1") enhanceCard(card);
    });
  }

  function boot(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    ensureModal();
    scan(document);

    const observer = new MutationObserver(() => scan(document));
    observer.observe(messages, {childList:true, subtree:true});

    document.addEventListener("click", () => setTimeout(() => scan(document), 0), true);
    document.addEventListener("submit", () => setTimeout(() => scan(document), 0), true);

    let passes = 0;
    const timer = setInterval(() => {
      scan(document);
      passes += 1;
      if(passes >= 150) clearInterval(timer);
    }, 300);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();

  window.__catalogoImagensV3 = {PRODUCTS, candidates, scan};
})();