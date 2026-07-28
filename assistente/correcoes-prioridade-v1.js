(() => {
  "use strict";

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function oldPersonalizedLinks(){
    return [...document.querySelectorAll('#messages a.action-btn[href*="api.whatsapp.com/send"]')]
      .filter((link) => {
        const text = normalize(link.textContent);
        return text.includes("enviar ideia ao atendimento") || text.includes("enviar projeto pelo whatsapp");
      });
  }

  function removeOldPersonalizedCards(){
    oldPersonalizedLinks().forEach((link) => link.closest(".action-card")?.remove());
  }

  function linkMessage(link){
    try{
      return new URL(link.href).searchParams.get("text") || "";
    }catch(_){
      return "";
    }
  }

  function preservePersonalizedDetails(previousMessage, correction){
    const correctedLink = [...document.querySelectorAll('#messages a.action-btn[href*="api.whatsapp.com/send"]')]
      .reverse()
      .find((link) => normalize(link.textContent).includes("enviar projeto corrigido pelo whatsapp"));
    if(!correctedLink || !previousMessage) return;

    try{
      const url = new URL(correctedLink.href);
      const message = `${previousMessage}\n\nCorreção solicitada: ${correction}\nMantenha os demais detalhes do projeto que não foram alterados.`;
      url.searchParams.set("text", message);
      correctedLink.href = url.toString();
    }catch(_){/* mantém o link criado pela camada principal */}
  }

  function handleCorrection(event){
    const form = event.target.closest?.("#composer");
    const input = document.querySelector("#question");
    const api = window.__correcoesContextoV1;
    if(!form || !input || !api) return;

    const raw = String(input.value || "").trim();
    if(!raw) return;

    const text = api.normalize(raw);
    const current = window.__catalogoConversaV2?.flow;

    if(api.state.pendingField){
      const field = api.state.pendingField;
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      api.state.pendingField = null;
      api.applyField(field, raw);
      input.focus();
      return;
    }

    const target = api.correctionTarget(text);
    const signal = api.correctionSignal(text);
    const engravingPlacement = current?.stage === "engraving" && target === "engraving" &&
      ["em ambas", "nas duas", "nos dois"].some((term) => text.includes(term));

    if(current?.selected && target && (signal || engravingPlacement)){
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      api.applyField(target, raw);
      input.focus();
      return;
    }

    const personalizedLinks = oldPersonalizedLinks();
    if(!current?.selected && signal && personalizedLinks.length){
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = "";
      const previousMessage = linkMessage(personalizedLinks[personalizedLinks.length - 1]);
      api.updatePersonalized(raw);
      preservePersonalizedDetails(previousMessage, raw);
      removeOldPersonalizedCards();
      input.focus();
    }
  }

  // Este arquivo é carregado antes dos fluxos específicos. O listener precisa ser
  // registrado imediatamente no document para vencer os tratadores de etapa.
  document.addEventListener("submit", handleCorrection, true);

  window.__correcoesPrioridadeV1 = Object.freeze({
    handleCorrection,
    oldPersonalizedLinks,
    removeOldPersonalizedCards,
    linkMessage,
    preservePersonalizedDetails
  });
})();
