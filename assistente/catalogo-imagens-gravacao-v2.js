(() => {
  "use strict";

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
      image:"https://dcdn-us.mitiendanube.com/stores/002/194/938/products/3caa63d4-6861-4cd6-93fb-b3fa655aa1b7-6065054060b48ba53e17441630832383-640-0.webp"
    }
  });

  const POLICY = "A gravação é feita somente na parte interna das alianças e permite no máximo 15 caracteres. Acima disso não cabe na aliança e não é possível realizar a gravação.";
  const CDN_PATTERN = /https?:\/\/(?:dcdn-us\.mitiendanube\.com|d26lpennugtm8s\.cloudfront\.net)\/stores\/002\/194\/938\/products\/[^\s)'\"<>]+?\.(?:webp|jpe?g|png)(?:\?[^\s)'\"<>]*)?/gi;
  const resolving = new Map();

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function cacheKey(id){ return `coroa24k:image:${id}`; }

  function cached(id){
    try { return localStorage.getItem(cacheKey(id)) || ""; }
    catch(_) { return ""; }
  }

  function saveCache(id, src){
    if(!src) return;
    try { localStorage.setItem(cacheKey(id), src); }
    catch(_) {}
  }

  async function fetchWithTimeout(url, options = {}, timeout = 12000){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try{
      return await fetch(url, {...options, signal:controller.signal, cache:"force-cache"});
    }finally{
      clearTimeout(timer);
    }
  }

  function firstOfficialImage(text){
    const matches = String(text || "").match(CDN_PATTERN) || [];
    if(!matches.length) return "";
    const clean = matches.map((url) => url.replace(/&amp;/g, "&"));
    return clean.find((url) => /-(?:640|1024|original|huge)-0\./i.test(url)) ||
      clean.find((url) => !/-50-0\.|-100-0\./i.test(url)) || clean[0];
  }

  async function fromReader(page){
    const target = page.replace(/^https?:\/\//, "");
    const response = await fetchWithTimeout(`https://r.jina.ai/http://${target}`, {
      headers:{Accept:"text/plain"}
    });
    if(!response.ok) throw new Error(`reader ${response.status}`);
    return firstOfficialImage(await response.text());
  }

  async function fromMicrolink(page){
    const response = await fetchWithTimeout(`https://api.microlink.io/?url=${encodeURIComponent(page)}`, {
      headers:{Accept:"application/json"}
    });
    if(!response.ok) throw new Error(`microlink ${response.status}`);
    const payload = await response.json();
    const candidate = payload?.data?.image?.url || payload?.data?.logo?.url || "";
    return /mitiendanube|cloudfront/i.test(candidate) ? candidate : "";
  }

  async function resolveImage(id, product){
    if(product.image) return product.image;
    const stored = cached(id);
    if(stored) return stored;
    if(resolving.has(id)) return resolving.get(id);

    const promise = (async () => {
      for(const resolver of [fromReader, fromMicrolink]){
        try{
          const src = await resolver(product.page);
          if(src){
            saveCache(id, src);
            return src;
          }
        }catch(_) {}
      }
      return "";
    })();

    resolving.set(id, promise);
    try { return await promise; }
    finally { resolving.delete(id); }
  }

  function ensureModal(){
    let modal = document.querySelector("#ringPhotoModalV2");
    if(modal) return modal;
    modal = document.createElement("div");
    modal.id = "ringPhotoModalV2";
    modal.style.cssText = "display:none;position:fixed;inset:0;z-index:9999;place-items:center;padding:18px;background:rgba(0,0,0,.84);backdrop-filter:blur(5px)";
    modal.innerHTML = `
      <div role="dialog" aria-modal="true" aria-label="Foto ampliada da aliança" style="width:min(620px,100%);background:#0d1b13;border:1px solid rgba(218,176,83,.35);border-radius:18px;padding:12px;box-shadow:0 24px 70px rgba(0,0,0,.55)">
        <button type="button" data-close-ring-photo-v2 style="display:block;margin-left:auto;border:0;background:transparent;color:#f5df98;font-size:1.8rem;padding:2px 8px;cursor:pointer" aria-label="Fechar imagem">×</button>
        <img data-ring-modal-image-v2 alt="" style="display:block;width:100%;max-height:72vh;object-fit:contain;border-radius:14px;background:#fff" />
        <div data-ring-modal-title-v2 style="padding:11px 5px 4px;color:#f5df98;font-weight:700;text-align:center"></div>
      </div>`;
    const close = () => {
      modal.style.display = "none";
      document.body.style.overflow = "";
    };
    modal.addEventListener("click", (event) => {
      if(event.target === modal || event.target.closest("[data-close-ring-photo-v2]")) close();
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
    modal.querySelector("[data-ring-modal-image-v2]").src = src;
    modal.querySelector("[data-ring-modal-image-v2]").alt = `Aliança modelo ${name}`;
    modal.querySelector("[data-ring-modal-title-v2]").textContent = `Modelo ${name}`;
    modal.style.display = "grid";
    document.body.style.overflow = "hidden";
  }

  function makeImageBlock(id, product){
    const wrapper = document.createElement("button");
    wrapper.type = "button";
    wrapper.dataset.ringPhotoV2 = id;
    wrapper.setAttribute("aria-label", `Ampliar foto da aliança modelo ${product.name}`);
    wrapper.style.cssText = "display:grid;place-items:center;width:100%;min-height:210px;padding:0;border:1px solid rgba(218,176,83,.24);border-radius:14px;overflow:hidden;background:linear-gradient(135deg,rgba(218,176,83,.14),rgba(8,24,16,.95));cursor:zoom-in";

    const status = document.createElement("div");
    status.dataset.ringImageStatus = "1";
    status.style.cssText = "padding:26px 18px;text-align:center;color:#f3dda0;font-weight:700";
    status.innerHTML = `<span style="display:block;font-size:1.9rem;margin-bottom:7px">♛</span>Carregando foto do modelo ${product.name}…`;
    wrapper.appendChild(status);

    resolveImage(id, product).then((src) => {
      if(!wrapper.isConnected) return;
      if(!src){
        status.innerHTML = `<span style="display:block;font-size:1.7rem;margin-bottom:6px">♛</span>Foto indisponível no momento<br><small style="font-weight:500;opacity:.82">Toque para abrir o produto oficial</small>`;
        wrapper.style.cursor = "pointer";
        wrapper.addEventListener("click", () => window.open(product.page, "_blank", "noopener,noreferrer"), {once:true});
        return;
      }

      const image = document.createElement("img");
      image.alt = `Aliança modelo ${product.name} — foto oficial Emporium24k`;
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.style.cssText = "display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#fff";
      image.addEventListener("load", () => {
        wrapper.replaceChildren(image);
        wrapper.dataset.imageSrc = src;
      }, {once:true});
      image.addEventListener("error", () => {
        try { localStorage.removeItem(cacheKey(id)); } catch(_) {}
        status.innerHTML = `<span style="display:block;font-size:1.7rem;margin-bottom:6px">♛</span>Não foi possível carregar a foto<br><small style="font-weight:500;opacity:.82">Toque para abrir o produto oficial</small>`;
        wrapper.onclick = () => window.open(product.page, "_blank", "noopener,noreferrer");
      }, {once:true});
      image.src = src;
      wrapper.onclick = () => openModal(src, product.name);
    });

    return wrapper;
  }

  function addProductImage(card){
    if(!(card instanceof HTMLElement) || card.dataset.ringImageV2 === "1") return;
    const modelButton = card.querySelector("button[data-ring-model]");
    if(!modelButton) return;
    const id = modelButton.dataset.ringModel;
    const product = PRODUCTS[id];
    if(!product) return;

    card.querySelectorAll(".ring-photo-button,.ring-photo-placeholder,[data-ring-photo-v2]").forEach((item) => item.remove());
    card.insertBefore(makeImageBlock(id, product), card.firstChild);
    card.dataset.ringImageV2 = "1";
  }

  function isCatalogBubble(text){
    const value = normalize(text);
    return [
      "valores de referencia do catalogo",
      "estes sao modelos de ouro 18k",
      "estes sao modelos de prata 925",
      "encontrei o modelo correspondente",
      "encontrei mais de uma opcao",
      "quero ver aliancas em ouro",
      "quero ver aliancas em prata"
    ].some((signal) => value.includes(signal));
  }

  function updateEngravingText(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user")) return;
    let html = bubble.innerHTML;
    html = html
      .replace(/A gravação gratuita é feita somente na parte interna das alianças, com até 15 caracteres\.[\s\S]*?(?=<\/div>|$)/gi, POLICY)
      .replace(/A gravação gratuita é somente interna e aceita até 15 caracteres\.[\s\S]*?O que você deseja gravar\?/gi, `${POLICY} O que você deseja gravar?`)
      .replace(/A gravação gratuita é feita somente na parte interna, com até 15 caracteres\.[\s\S]*?Caso ainda não tenha decidido, pode dizer isso\./gi, `${POLICY} Caso ainda não tenha decidido, pode dizer isso.`);
    if(html !== bubble.innerHTML) bubble.innerHTML = html;

    if(isCatalogBubble(bubble.textContent) && !bubble.dataset.engravingPolicyV2){
      const note = document.createElement("div");
      note.style.cssText = "margin-top:10px;padding-top:9px;border-top:1px solid rgba(218,176,83,.22);font-size:.9em;line-height:1.45";
      note.innerHTML = `<strong>Gravação interna:</strong> ${POLICY}`;
      bubble.appendChild(note);
      bubble.dataset.engravingPolicyV2 = "1";
    }
  }

  function scan(root = document){
    root.querySelectorAll?.("#messages .action-card").forEach(addProductImage);
    root.querySelectorAll?.("#messages .row:not(.user) .bubble").forEach(updateEngravingText);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const messages = document.querySelector("#messages");
    if(!messages) return;
    ensureModal();
    scan(document);

    const observer = new MutationObserver(() => scan(document));
    observer.observe(messages, {childList:true, subtree:true});

    let rounds = 0;
    const timer = setInterval(() => {
      scan(document);
      rounds += 1;
      if(rounds >= 80) clearInterval(timer);
    }, 400);

    document.addEventListener("click", () => setTimeout(() => scan(document), 0), true);
    document.addEventListener("submit", () => setTimeout(() => scan(document), 0), true);
  });

  window.__catalogoImagensGravacaoV2 = {PRODUCTS, POLICY, normalize, resolveImage, scan};
})();
