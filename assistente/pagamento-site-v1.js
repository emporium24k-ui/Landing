(() => {
  "use strict";

  const config = window.__EMP24K_CONFIG__;
  const state = {busy:false};

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function classify(text){
    if(!text || text.length > 260) return null;

    if(/\b(boleto|boletos|boletado)\b/.test(text)){
      if(includesAny(text, ["parcelado", "parcelar", "parcelamento", "em quantas vezes"])) return "boleto_installments";
      return "boleto";
    }

    if(/\bpix\b/.test(text)) return "pix";

    if(includesAny(text, [
      "12 vezes", "doze vezes", "10 vezes", "dez vezes", "quantas vezes", "quantas parcelas",
      "em quantas vezes", "ate quantas vezes", "parcelamento no cartao", "parcelam no cartao",
      "cartao tem juros", "sem juros", "juros do cartao", "cartao de credito", "no credito"
    ])) return "card";

    if(includesAny(text, [
      "formas de pagamento", "forma de pagamento", "meios de pagamento", "como posso pagar",
      "como paga", "quais pagamentos", "opcoes de pagamento", "aceitam quais formas",
      "pagamento pelo site", "condicoes de pagamento"
    ])) return "methods";

    return null;
  }

  function response(topic){
    const note = "Os descontos podem não acumular com algumas promoções.";
    const messages = {
      methods: `No site, você pode pagar com <strong>Pix com 10% de desconto</strong>, <strong>boleto com 5% de desconto</strong> ou <strong>cartão de crédito em até 10x sem juros</strong>. ${note}`,
      pix: `No site, o pagamento por <strong>Pix tem 10% de desconto</strong>. ${note}`,
      boleto: `No site, o <strong>boleto tem 5% de desconto</strong> e é uma forma de pagamento à vista. ${note}`,
      boleto_installments: `No site, o boleto é uma forma de pagamento <strong>à vista, com 5% de desconto</strong>; ele não aparece como parcelado. Para parcelar, o cartão de crédito permite <strong>até 10x sem juros</strong>. ${note}`,
      card: "No site, o cartão de crédito pode ser parcelado em <strong>até 10x sem juros</strong>."
    };
    return messages[topic];
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
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

  function addSiteButton(){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card store-card compact-card";
    link.className = "action-btn store";
    link.href = config?.store?.products || "https://www.emporium24k.com.br/produtos/";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Ver produtos e condições no site";
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw, topic){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 220));
    addMessage(response(topic));
    addSiteButton();
    state.busy = false;
    input?.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const topic = classify(normalize(raw));
      if(!topic) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, topic);
    }, true);
  });

  window.__pagamentoSiteV1 = Object.freeze({normalize, classify, response});
})();