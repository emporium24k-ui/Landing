(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const TESTIMONIALS = "https://www.emporium24k.com.br/depoimentos/";
  const GOOGLE_REVIEWS = "https://www.google.com/maps/search/?api=1&query=Emporium24k%20Curitiba";
  const state = { busy: false, phone: null, last: {}, trustContextUntil: 0 };

  const replies = {
    deliverySecurity: {
      medium: [
        "Entendo sua preocupação. O pedido é formalizado com nota fiscal e, nas joias em ouro 18k ou prata 925, acompanha certificado e garantia vitalícia do teor. O envio é feito gratuitamente por Sedex, com código de rastreio, e você também pode conferir nosso endereço físico, depoimentos e avaliações antes de comprar.",
        "Para dar segurança à compra, emitimos nota fiscal, fornecemos a documentação correspondente à joia e enviamos por Sedex com rastreamento. A Emporium24k também possui CNPJ ativo e atendimento físico em Curitiba, além de avaliações públicas para consulta."
      ],
      detailed: [
        "Entendo totalmente essa preocupação, principalmente em uma compra feita à distância. A compra é formalizada com nota fiscal; nas joias em ouro 18k ou prata 925, você recebe certificado e garantia vitalícia do teor do material. A Emporium24k possui CNPJ ativo e atendimento físico em Curitiba. Depois da produção, o pedido é enviado gratuitamente por Sedex para todo o Brasil e você recebe o código para acompanhar o rastreamento. Antes de fechar, também é possível conferir nossos depoimentos, avaliações públicas e falar diretamente com a equipe.",
        "Sua preocupação é legítima. Para reduzir o risco, mantemos a compra documentada, emitimos nota fiscal e fornecemos certificado nas joias de ouro 18k ou prata 925. Temos empresa registrada e endereço físico em Curitiba. O envio nacional é gratuito, realizado por Sedex e acompanhado por código de rastreio. Você ainda pode verificar avaliações e experiências de outros clientes antes de concluir o pagamento."
      ]
    },
    paymentSafety: {
      medium: [
        "Entendo que pagar quando chegar parece mais seguro. Porém, nas peças feitas por encomenda, o pagamento é confirmado no pedido porque a produção é iniciada especialmente para você. Para sua segurança, emitimos nota fiscal, fornecemos a documentação da joia e enviamos por Sedex com rastreamento.",
        "Compreendo seu receio. Para peças sob encomenda, não trabalhamos com o pagamento integral somente na entrega, pois precisamos confirmar o pedido para iniciar a produção. A compra fica documentada e o envio é feito por Sedex com código de rastreio."
      ],
      detailed: [
        "Entendo perfeitamente que você prefira pagar quando a peça chegar. No entanto, nas peças feitas por encomenda, não trabalhamos com o pagamento integral somente na entrega, porque a produção é iniciada exclusivamente para o pedido. Para tornar a compra segura, emitimos nota fiscal; nas joias em ouro 18k ou prata 925, fornecemos certificado e garantia vitalícia do teor; temos CNPJ ativo e atendimento físico em Curitiba; e o envio é feito gratuitamente por Sedex, com código de rastreio. Você também pode conferir depoimentos e avaliações antes de fechar.",
        "Sua preocupação com segurança é totalmente compreensível. Como alianças e outras peças sob encomenda são produzidas especialmente para cada pedido, o pagamento precisa ser confirmado para iniciarmos a fabricação. Em contrapartida, a compra é formalizada com nota fiscal, a joia recebe a documentação correspondente, a empresa possui endereço físico em Curitiba e o envio é feito por Sedex com rastreamento. Antes de pagar, você pode verificar nossas avaliações e confirmar todos os dados com um atendente."
      ]
    }
  };

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function isPayOnDelivery(text){
    return includesAny(text, [
      "pagar quando chegar", "pago quando chegar", "pagamento quando chegar",
      "pagar quando receber", "pago quando receber", "pagamento na entrega",
      "pagar na entrega", "contra entrega", "so pago quando chegar",
      "so pago quando receber", "prefiro pagar quando chegar", "prefiro pagar na entrega"
    ]);
  }

  function hasDeliveryConcern(text){
    const concern = /\b(certeza|seguranca|seguro|confiar|confianca|garantia|medo|receio|golpe|prova|comprovar|realmente)\b/.test(text);
    const delivery = /\b(entrega|entregar|entregam|entregue|receber|recebo|receberei|chegar|chega|pedido|encomenda|envio|enviado)\b/.test(text);
    const explicit = includesAny(text, [
      "qual a certeza", "como tenho certeza", "como posso ter certeza",
      "qual seguranca da entrega", "seguranca da entrega", "garantia da entrega",
      "voces realmente vao me entregar", "voces realmente entregam",
      "como sei que vou receber", "como sei que vai chegar", "como sei que entregam"
    ]);
    return explicit || (concern && delivery);
  }

  function classify(text){
    if(isPayOnDelivery(text)) return "paymentSafety";
    if(hasDeliveryConcern(text)) return "deliverySecurity";

    if(Date.now() <= state.trustContextUntil && includesAny(text, [
      "mas quero pagar quando chegar", "quero pagar quando chegar", "pra minha seguranca",
      "para minha seguranca", "ainda prefiro pagar na entrega"
    ])) return "paymentSafety";

    return null;
  }

  function detailLevel(raw, normalized, topic){
    const words = normalized.split(" ").filter(Boolean).length;
    const concepts = [
      /\b(certeza|seguranca|seguro|confiar|garantia|medo|receio)\b/,
      /\b(entrega|entregar|receber|chegar|envio|pedido)\b/,
      /\b(pagar|pagamento|quando chegar|na entrega)\b/,
      /\b(peca|joia|joias|alianca|aliancas|encomenda)\b/
    ].filter((pattern) => pattern.test(normalized)).length;

    if(raw.length >= 65 || words >= 10 || concepts >= 3) return "detailed";
    if(topic === "paymentSafety") return "medium";
    return "medium";
  }

  function pick(topic, level){
    const list = replies[topic][level];
    const key = `${topic}:${level}`;
    let index;
    do index = Math.floor(Math.random() * list.length);
    while(index === state.last[key] && list.length > 1);
    state.last[key] = index;
    return list[index];
  }

  function choosePhone(){
    if(state.phone) return state.phone;
    try{
      const saved = sessionStorage.getItem("coroa24kSalesPhone");
      if(SALES.includes(saved)) return state.phone = saved;
      const data = new Uint32Array(1);
      crypto.getRandomValues(data);
      state.phone = SALES[data[0] % SALES.length];
      sessionStorage.setItem("coroa24kSalesPhone", state.phone);
    }catch(_){
      state.phone = SALES[Math.random() < 0.5 ? 0 : 1];
    }
    return state.phone;
  }

  function whatsappUrl(raw){
    const message = `Olá! Quero confirmar a segurança da compra e da entrega. Minha dúvida: ${raw}`;
    return `https://api.whatsapp.com/send/?phone=${choosePhone()}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
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

  function addLink(url, label, kind = "store"){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = `action-card compact-card ${kind === "store" ? "store-card" : ""}`;
    link.className = `action-btn ${kind}`;
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  async function answer(raw, topic, normalized){
    if(state.busy) return;
    state.busy = true;
    const input = document.querySelector("#question");
    if(input) input.value = "";
    addMessage(escapeHtml(raw), "user");
    await new Promise((resolve) => setTimeout(resolve, 280));
    addMessage(pick(topic, detailLevel(raw, normalized, topic)));
    state.trustContextUntil = Date.now() + 10 * 60 * 1000;
    addLink(GOOGLE_REVIEWS, "Ver avaliações no Google");
    addLink(TESTIMONIALS, "Ver depoimentos");
    addLink(whatsappUrl(raw), "Falar sobre a segurança do pedido", "wa");
    state.busy = false;
    if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    if(!form || !input) return;

    form.addEventListener("submit", (event) => {
      const raw = String(input.value || "").trim();
      const normalized = normalize(raw);
      const topic = classify(normalized);
      if(!topic) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      answer(raw, topic, normalized);
    }, true);
  });

  window.__segurancaEntregaV1 = {normalize, classify, detailLevel, replies, state};
})();