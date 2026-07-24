(() => {
  "use strict";

  let busy = false;
  const last = {};

  const replies = {
    presencial: [
      "Atendemos presencialmente apenas em Curitiba e região. Para outras cidades, enviamos por Sedex.",
      "Nosso atendimento presencial é somente para Curitiba e região. Para o restante do Brasil, fazemos envio por Sedex.",
      "Presencialmente atendemos Curitiba e região. Também enviamos para todo o Brasil.",
      "Você pode ser atendido presencialmente em Curitiba e região. Fora daqui, o pedido segue por Sedex."
    ],
    envio: [
      "Enviamos joias, semijoias e alianças por Sedex para todo o Brasil, com frete grátis.",
      "Todos os envios pelos Correios são feitos por Sedex e o frete é gratuito.",
      "Sim. Enviamos para todo o Brasil por Sedex, sem custo de frete.",
      "O envio é sempre por Sedex, tanto para alianças quanto para joias e semijoias. O frete é grátis."
    ],
    combinado: [
      "Atendemos presencialmente apenas em Curitiba e região. Para outras cidades, enviamos por Sedex com frete grátis.",
      "Curitiba e região têm atendimento presencial. Para todo o Brasil, enviamos por Sedex gratuitamente.",
      "Presencialmente, somente Curitiba e região. No restante do país, o envio é por Sedex e sem custo."
    ]
  };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function classify(text){
    const presencial = includesAny(text, [
      "atendimento presencial", "atendem presencialmente", "atende presencialmente",
      "posso ir na loja", "posso visitar", "visitar a loja", "retirar na loja",
      "retirada presencial", "onde voces atendem", "atendem em curitiba",
      "atende curitiba", "regiao metropolitana", "tem loja fisica", "presencial",
      "atendem em sao paulo", "atendem no rio", "atendem minha cidade", "atendem na minha cidade"
    ]);

    const envio = includesAny(text, [
      "sedex", "correios", "frete gratis", "frete gratuito", "qual o frete",
      "qual frete", "como enviam", "forma de envio", "envio para todo brasil",
      "enviam para todo brasil", "enviam para", "mandam para", "entregam em",
      "qual transportadora", "enviam por pac", "envio por pac", "prazo de entrega"
    ]);

    if(presencial && envio) return "combinado";
    if(presencial) return "presencial";
    if(envio) return "envio";
    return null;
  }

  function pick(topic){
    const list = replies[topic];
    let index;
    do index = Math.floor(Math.random() * list.length);
    while(index === last[topic] && list.length > 1);
    last[topic] = index;
    return list[index];
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function escapeHtml(value){
    return value.replace(/[&<>"']/g, (char) => ({
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

  async function answer(raw, topic){
    if(busy) return;
    busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 260));
    addMessage(pick(topic));
    busy = false;
    if(input) input.focus();
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

  window.__entregaPresencialV1 = {normalize, classify, replies};
})();
