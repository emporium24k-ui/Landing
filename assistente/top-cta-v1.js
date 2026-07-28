(() => {
  "use strict";

  function config(){
    return window.__EMP24K_CONFIG__ || {
      contacts:{allianceSales:["5541995888995", "5541995776736"], boss:"5541998518452"}
    };
  }

  function message(){
    const summary = window.__coordenadorCentralV1?.buildSummary?.();
    return summary || "Olá! Vim pelo assistente Coroa 24K e gostaria de falar com um atendente.";
  }

  function phone(){
    const routing = window.__EMP24K_ROUTING__;
    if(routing?.routeForText) return routing.routeForText(message());
    if(routing?.alliancePhone) return routing.alliancePhone();
    return config().contacts?.allianceSales?.[0] || config().contacts?.boss || "5541995888995";
  }

  function whatsappUrl(){
    return `https://api.whatsapp.com/send/?phone=${phone()}&text=${encodeURIComponent(message())}&type=phone_number&app_absent=0`;
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

  window.__topCtaV1 = {whatsappUrl, message, phone};
})();