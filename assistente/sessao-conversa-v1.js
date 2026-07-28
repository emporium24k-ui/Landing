(() => {
  "use strict";

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

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#newConversation")?.remove();
    document.querySelector("#composer")?.addEventListener("submit", touch, true);
    document.addEventListener("click", touch, true);
    touch();
  });

  window.__sessaoConversaV1 = Object.freeze({expired, touch, clearConversationStorage, idleMs:IDLE_MS});
})();