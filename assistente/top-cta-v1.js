(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const MESSAGE = "Olá! Vim pelo assistente Coroa 24K e gostaria de falar com um atendente.";

  function choosePhone(){
    try{
      const data = new Uint32Array(1);
      crypto.getRandomValues(data);
      return SALES[data[0] % SALES.length];
    }catch(_){
      return SALES[Math.random() < 0.5 ? 0 : 1];
    }
  }

  function whatsappUrl(){
    const phone = choosePhone();
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(MESSAGE)}&type=phone_number&app_absent=0`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector("#topCta");
    if(!button) return;

    button.textContent = "Falar com atendente";
    button.setAttribute("aria-label", "Abrir atendimento no WhatsApp");

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.open(whatsappUrl(), "_blank", "noopener,noreferrer");
    }, true);
  });
})();
