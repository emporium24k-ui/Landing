(() => {
  "use strict";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const internalMatches = (text) => /(anatomica|anatomico|semi anatomica|semi anatomico|semianatomica|semianatomico|interno reto|parte interna reta|confort fit|comfort fit|conforto interno)/.test(text);
  const externalMatches = (text) => /(abaulada|abaulado|chanfrada|chanfrado|quinada|quinado|chapada|chapado|formato da alianca|formatos da alianca)/.test(text);
  const matches = (text) => internalMatches(text) || externalMatches(text);
  const clock = () => new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));

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
    stack.className = "message-stack";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = html;
    const meta = document.createElement("div");
    meta.className = "bubble-meta";
    meta.textContent = who === "user" ? clock() : `Coroa 24K · ${clock()}`;
    stack.append(bubble, meta);
    row.appendChild(stack);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function internalDiagram(type){
    const cavity = type === "anatomico"
      ? "M24 78 Q90 28 156 78 L156 100 H24 Z"
      : type === "semianatomico"
        ? "M24 78 Q90 52 156 78 L156 100 H24 Z"
        : "M24 66 H156 V100 H24 Z";
    return `<svg viewBox="0 0 180 112" role="img" aria-label="Corte interno ${type}" style="display:block;width:100%;height:104px;background:#fff;border-radius:12px">
      <path d="M14 98 L22 40 Q90 10 158 40 L166 98 Z" fill="#d9aa48" stroke="#f6dc8a" stroke-width="3"/>
      <path d="${cavity}" fill="#0e1c14" stroke="#f7ecd0" stroke-width="2"/>
      <path d="M12 101 H168" stroke="#d7d0bd" stroke-width="2"/>
    </svg>`;
  }

  function externalDiagram(type){
    const shape = type === "abaulado"
      ? '<path d="M18 78 Q90 15 162 78 L162 96 L18 96 Z" fill="#d9aa48" stroke="#f6dc8a" stroke-width="3"/>'
      : type === "chanfrado"
        ? '<path d="M30 24 H150 L166 44 V96 H14 V44 Z" fill="#d9aa48" stroke="#f6dc8a" stroke-width="3"/>'
        : '<rect x="16" y="30" width="148" height="66" rx="5" fill="#d9aa48" stroke="#f6dc8a" stroke-width="3"/>';
    return `<svg viewBox="0 0 180 112" role="img" aria-label="Formato ${type}" style="display:block;width:100%;height:104px;background:#fff;border-radius:12px">
      ${shape}
      <path d="M12 101 H168" stroke="#d7d0bd" stroke-width="2"/>
    </svg>`;
  }

  function makePanel(title, items, dataAttribute){
    const sections = items.map((item) => `
      <section ${dataAttribute}="${item.key}" style="text-align:center;padding:10px;border:1px solid rgba(245,223,152,.16);border-radius:14px;background:rgba(255,255,255,.035)">
        ${item.svg}
        <strong style="display:block;color:#f5df98;margin-top:8px">${item.label}</strong>
        <small style="display:block;color:#adbbb2;line-height:1.4;margin-top:4px">${item.description}</small>
      </section>`).join("");
    return `<article class="action-card" style="max-width:720px;padding:16px;border-color:rgba(215,173,80,.32);background:linear-gradient(145deg,rgba(28,43,34,.98),rgba(17,28,22,.98))">
      <div style="font-weight:900;color:#f5df98;text-align:center;font-size:15px;margin-bottom:14px">${title}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">${sections}</div>
    </article>`;
  }

  function addInternalVisual(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = makePanel("Parte interna das alianças", [
      {key:"anatomico", label:"Anatômico", description:"Interior bem arredondado.", svg:internalDiagram("anatomico")},
      {key:"semianatomico", label:"Semianatômico", description:"Interior levemente arredondado.", svg:internalDiagram("semianatomico")},
      {key:"reto", label:"Interno reto", description:"Interior plano e tradicional.", svg:internalDiagram("reto")}
    ], "data-comfort-visual");
    messages.appendChild(wrapper.firstElementChild);
    messages.scrollTop = messages.scrollHeight;
  }

  function addExternalVisual(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = makePanel("Formatos visuais das alianças", [
      {key:"abaulado", label:"Abaulado", description:"Curvo e arredondado por fora.", svg:externalDiagram("abaulado")},
      {key:"reto", label:"Reto/chapado", description:"Superfície externa plana.", svg:externalDiagram("reto")},
      {key:"chanfrado", label:"Chanfrado/quinado", description:"Laterais inclinadas e marcadas.", svg:externalDiagram("chanfrado")}
    ], "data-profile-visual");
    messages.appendChild(wrapper.firstElementChild);
    messages.scrollTop = messages.scrollHeight;
  }

  function addVisual(){
    addInternalVisual();
  }

  async function answer(raw){
    const input = document.querySelector("#question");
    const text = normalize(raw);
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 180));

    const showInternal = internalMatches(text);
    const showExternal = externalMatches(text);

    if(showExternal){
      addMessage("Veja abaixo a diferença visual entre <strong>abaulado</strong>, <strong>reto/chapado</strong> e <strong>chanfrado/quinado</strong>.");
      addExternalVisual();
    }
    if(showInternal){
      addMessage("Veja também a diferença entre <strong>anatômico</strong>, <strong>semianatômico</strong> e <strong>interno reto</strong>. Essa comparação é explicativa; no fluxo da compra não fazemos uma segunda pergunta repetida.");
      addInternalVisual();
    }
    input?.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;
    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      if(!raw || !matches(normalize(raw))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw);
    }, true);
  });

  window.__confortoInternoV1 = Object.freeze({matches, internalMatches, externalMatches, addVisual, addInternalVisual, addExternalVisual});
})();