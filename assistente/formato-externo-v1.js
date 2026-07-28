(() => {
  "use strict";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));

  const clock = () => new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  const currentFlow = () => window.__catalogoConversaV2?.flow;

  function normalizeFormat(raw){
    const text = normalize(raw);
    if(text.includes("abaulad")) return "Abaulado";
    if(text.includes("chanfrad") || text.includes("quinad")) return "Chanfrado/quinado";
    if(text.includes("chapad") || /\breto\b/.test(text) || text.includes("original") || text.includes("manter")) return "Reto/chapado — formato original";
    if(/\b(nao sei|ainda nao sei|nao decidi|ainda nao decidi|tanto faz)\b/.test(text)) return "Ainda não decidido";
    return String(raw || "").trim();
  }

  function profileSvg(kind){
    const shape = kind === "abaulado"
      ? '<path d="M18 78 Q90 15 162 78 L162 92 L18 92 Z" fill="#d9aa48" stroke="#f7df94" stroke-width="3"/>'
      : kind === "chanfrado"
        ? '<path d="M30 22 H150 L166 42 V92 H14 V42 Z" fill="#d9aa48" stroke="#f7df94" stroke-width="3"/>'
        : '<rect x="16" y="28" width="148" height="64" rx="5" fill="#d9aa48" stroke="#f7df94" stroke-width="3"/>';
    return `<svg viewBox="0 0 180 108" role="img" aria-label="Formato ${kind}" style="display:block;width:100%;height:92px;margin:auto;background:#fff;border-radius:11px">
      <path d="M8 96 H172" stroke="#d7d0bd" stroke-width="2"/>
      ${shape}
      <path d="M30 82 H150" stroke="#8b611e" stroke-width="3" opacity=".7"/>
    </svg>`;
  }

  function decorateFormatButton(button, kind, label, description){
    if(button.dataset.formatVisualReady === "1") return;
    button.dataset.formatVisualReady = "1";
    button.setAttribute("aria-label", label);
    button.style.cssText = "display:grid;grid-template-columns:116px 1fr;gap:12px;align-items:center;width:100%;min-height:116px;padding:10px;text-align:left;border-radius:14px";
    button.innerHTML = `<span style="display:block">${profileSvg(kind)}</span><span><strong style="display:block;font-size:.96rem;line-height:1.25">${label}</strong><small style="display:block;margin-top:5px;line-height:1.35;opacity:.78">${description}</small></span>`;
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

  function addUnknownSizesChoice(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const button = document.createElement("button");
    card.className = "action-card compact-card";
    card.style.display = "grid";
    card.style.gap = "8px";
    button.type = "button";
    button.className = "action-btn wa";
    button.dataset.conversationUnknownSizes = "1";
    button.textContent = "Ainda não sei os aros";
    card.appendChild(button);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function continueToSizes(raw){
    const flow = currentFlow();
    if(!flow || flow.stage !== "external_profile") return false;
    const selected = normalizeFormat(raw);
    flow.externalProfile = selected;
    flow.internalComfort = "";
    flow.stage = "sizes";
    addMessage(escapeHtml(selected), "user");
    addMessage("Perfeito. Quais são as numerações dos dois aros? Caso ainda não saiba, pode responder simplesmente <strong>“não sei os aros”</strong>.");
    addUnknownSizesChoice();
    document.querySelector("#question")?.focus();
    return true;
  }

  function rewriteBubble(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.closest(".row.user")) return;
    let html = bubble.innerHTML;
    html = html
      .replace(/qual <strong>formato externo<\/strong> você prefere\?/gi, "qual <strong>formato da aliança</strong> você prefere?")
      .replace(/<strong>reto\/chapado<\/strong> é plano; e <strong>chanfrado\/quinado<\/strong> possui as laterais marcadas\.[\s\S]*?valor final\./gi, "<strong>reto/chapado</strong> é o formato original e plano; e <strong>chanfrado/quinado</strong> possui as laterais marcadas. Escolher abaulado ou chanfrado/quinado pode alterar o valor final.")
      .replace(/Formato externo:\s*([^|<]+?)\s*\|\s*Conforto interno:\s*[^|<]*\|/gi, "Formato: $1 |")
      .replace(/Agora escolha o <strong>conforto interno<\/strong>[\s\S]*?formato externo:/gi, "");
    if(html !== bubble.innerHTML) bubble.innerHTML = html;
  }

  function rewriteChoices(root){
    const scope = root instanceof HTMLElement ? root : document;
    const buttons = [...(scope.querySelectorAll?.("button[data-conversation-external-profile]") || [])];
    const card = buttons[0]?.closest(".action-card");
    if(card && !card.querySelector("[data-format-visual-title]")){
      const title = document.createElement("div");
      title.dataset.formatVisualTitle = "1";
      title.innerHTML = "<strong>Escolha pelo desenho:</strong>";
      title.style.cssText = "color:#f5df98;font-size:.9rem;margin-bottom:2px";
      card.insertBefore(title, card.firstChild);
    }

    buttons.forEach((button) => {
      const value = normalize(button.dataset.conversationExternalProfile || button.textContent);
      if(value.includes("manter") || value.includes("formato original do modelo")){
        button.remove();
      }else if(value.includes("abaulad")){
        button.dataset.conversationExternalProfile = "Abaulado";
        decorateFormatButton(button, "abaulado", "Abaulado", "Superfície curva e arredondada.");
      }else if(value.includes("reto") || value.includes("chapado")){
        button.dataset.conversationExternalProfile = "Reto/chapado";
        decorateFormatButton(button, "reto", "Reto/chapado — formato original", "Superfície plana, igual ao modelo padrão.");
      }else if(value.includes("chanfrad") || value.includes("quinad")){
        button.dataset.conversationExternalProfile = "Chanfrado/quinado";
        decorateFormatButton(button, "chanfrado", "Chanfrado/quinado", "Laterais inclinadas e mais marcadas.");
      }
    });

    scope.querySelectorAll?.("button[data-conversation-internal-comfort]").forEach((button) => {
      button.closest(".action-card")?.remove();
    });
  }

  function rewriteWhatsApp(link){
    if(!(link instanceof HTMLAnchorElement) || !link.href.includes("api.whatsapp.com/send")) return;
    try{
      const url = new URL(link.href);
      const text = url.searchParams.get("text");
      if(!text) return;
      const updated = text.replace(/Formato externo:\s*([^|\n]+?)\s*\|\s*Conforto interno:\s*[^|\n]*\|/gi, "Formato: $1 |");
      if(updated !== text){
        url.searchParams.set("text", updated);
        link.href = url.toString();
      }
    }catch(_){/* link legado opcional */}
  }

  function processNode(node){
    if(!(node instanceof HTMLElement)) return;
    if(node.matches(".row:not(.user) .bubble")) rewriteBubble(node);
    node.querySelectorAll?.(".row:not(.user) .bubble").forEach(rewriteBubble);
    rewriteChoices(node);
    if(node.matches("a.action-btn.wa")) rewriteWhatsApp(node);
    node.querySelectorAll?.("a.action-btn.wa").forEach(rewriteWhatsApp);
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-conversation-external-profile]");
    const flow = currentFlow();
    if(!target || flow?.stage !== "external_profile") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    target.closest(".action-card")?.remove();
    continueToSizes(target.dataset.conversationExternalProfile || target.textContent);
  }, true);

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("#composer");
    const input = document.querySelector("#question");
    const flow = currentFlow();
    if(!form || !input || flow?.stage !== "external_profile") return;
    const raw = String(input.value || "").trim();
    if(!raw) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    input.value = "";
    continueToSizes(raw);
  }, true);

  document.addEventListener("DOMContentLoaded", () => {
    const messages = document.querySelector("#messages");
    if(!messages) return;
    processNode(messages);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(processNode));
    });
    observer.observe(messages, {childList:true, subtree:true});
  });

  window.__formatoExternoV1 = Object.freeze({normalizeFormat, continueToSizes, rewriteBubble, rewriteChoices, profileSvg});
})();