(() => {
  "use strict";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const matches = (text) => /(anatomica|anatomico|semi anatomica|semi anatomico|semianatomica|semianatomico|interno reto|parte interna reta|confort fit|comfort fit|conforto interno)/.test(text);
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

  function diagramSvg(type){
    const inner = type === "anatômico"
      ? "M20 58 Q60 20 100 58"
      : type === "semianatômico"
        ? "M20 58 Q60 38 100 58"
        : "M20 58 L100 58";
    return `<svg viewBox="0 0 120 82" role="img" aria-label="Corte interno ${type}" style="width:100%;max-width:150px;height:auto;display:block;margin:auto">
      <defs>
        <linearGradient id="gold-${type}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff0a8"/><stop offset=".45" stop-color="#d4a345"/><stop offset="1" stop-color="#8d621e"/>
        </linearGradient>
      </defs>
      <path d="M16 64 Q60 8 104 64" fill="none" stroke="url(#gold-${type})" stroke-width="18" stroke-linecap="round"/>
      <path d="${inner}" fill="none" stroke="#fff8dc" stroke-width="5" stroke-linecap="round"/>
    </svg>`;
  }

  function addVisual(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("article");
    card.className = "action-card";
    card.style.cssText = "max-width:680px;padding:16px;border-color:rgba(215,173,80,.32);background:linear-gradient(145deg,rgba(28,43,34,.98),rgba(17,28,22,.98))";
    card.innerHTML = `
      <div style="font-weight:900;color:#f5df98;text-align:center;font-size:15px;margin-bottom:14px">Conforto interno das alianças</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px">
        <section style="text-align:center;padding:12px;border:1px solid rgba(245,223,152,.16);border-radius:14px;background:rgba(255,255,255,.035)">
          ${diagramSvg("anatômico")}
          <strong style="display:block;color:#f5df98;margin-top:8px">Anatômico</strong>
          <small style="display:block;color:#adbbb2;line-height:1.4;margin-top:4px">Parte interna mais arredondada</small>
        </section>
        <section style="text-align:center;padding:12px;border:1px solid rgba(245,223,152,.16);border-radius:14px;background:rgba(255,255,255,.035)">
          ${diagramSvg("semianatômico")}
          <strong style="display:block;color:#f5df98;margin-top:8px">Semianatômico</strong>
          <small style="display:block;color:#adbbb2;line-height:1.4;margin-top:4px">Parte interna levemente arredondada</small>
        </section>
        <section style="text-align:center;padding:12px;border:1px solid rgba(245,223,152,.16);border-radius:14px;background:rgba(255,255,255,.035)">
          ${diagramSvg("reto")}
          <strong style="display:block;color:#f5df98;margin-top:8px">Reto</strong>
          <small style="display:block;color:#adbbb2;line-height:1.4;margin-top:4px">Parte interna plana</small>
        </section>
      </div>`;
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw){
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 180));
    addMessage("O <strong>conforto interno</strong> é o formato da parte da aliança que encosta no dedo:<br><br><strong>Reto:</strong> parte interna plana e acabamento tradicional.<br><strong>Semianatômico:</strong> leve arredondamento interno, equilibrando perfil e conforto.<br><strong>Anatômico:</strong> interior mais arredondado, que tende a acomodar melhor o dedo, principalmente em alianças mais largas.<br><br>O formato externo pode continuar igual. A disponibilidade e eventual diferença de valor são confirmadas conforme o modelo escolhido.");
    addVisual();
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

  window.__confortoInternoV1 = Object.freeze({matches, addVisual});
})();