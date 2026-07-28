(() => {
  "use strict";

  const BUILD = "20260727-56";
  const IDLE_MS = 30 * 60 * 1000;
  const LAST_ACTIVITY_KEY = "emp24kAssistantLastActivityV1";
  const SESSION_KEYS = [
    "emp24kAssistantStateV1",
    "coroa24kSalesPhone",
    "emp24kAssistantLastActivityV1"
  ];

  function lastActivity(){
    try{return Number(sessionStorage.getItem(LAST_ACTIVITY_KEY) || 0)}catch(_){return 0}
  }

  function clearConversationStorage(){
    try{SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key))}catch(_){/* opcional */}
  }

  function expired(){
    const last = lastActivity();
    return Boolean(last && Date.now() - last > IDLE_MS);
  }

  if(expired()) clearConversationStorage();

  function touch(){
    try{sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))}catch(_){/* opcional */}
  }

  function startNewConversation(){
    clearConversationStorage();
    try{sessionStorage.removeItem("emp24kMetricsSession")}catch(_){/* opcional */}
    const url = new URL(window.location.href);
    url.searchParams.set("build", BUILD);
    url.searchParams.set("nova", String(Date.now()));
    window.location.replace(url.toString());
  }

  document.addEventListener("DOMContentLoaded", () => {
    const actions = document.querySelector(".top-actions");
    if(actions && !document.querySelector("#newConversation")){
      const button = document.createElement("button");
      button.id = "newConversation";
      button.type = "button";
      button.className = "new-conversation";
      button.textContent = "Nova";
      button.setAttribute("aria-label", "Iniciar nova conversa");
      button.title = "Iniciar nova conversa";
      button.addEventListener("click", startNewConversation);
      actions.insertBefore(button, actions.firstChild);
    }

    const form = document.querySelector("#composer");
    form?.addEventListener("submit", touch, true);
    document.addEventListener("click", (event) => {
      if(event.target.closest("#newConversation")) return;
      touch();
    }, true);
    touch();
  });

  window.__sessaoConversaV1 = Object.freeze({expired, touch, startNewConversation, clearConversationStorage, idleMs:IDLE_MS});
})();