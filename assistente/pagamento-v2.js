(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const state = { last: {}, busy: false, paymentContext: false, phone: null };

  const replies = {
    pix: [
      "Aceitamos Pix, sim.",
      "Sim, o pagamento pode ser feito por Pix.",
      "Trabalhamos com Pix. Os dados são enviados no fechamento do pedido."
    ],
    credit: [
      "Aceitamos cartão de crédito e parcelamos em até 12 vezes.",
      "Sim. No cartão de crédito, o pedido pode ser dividido em até 12 vezes.",
      "Trabalhamos com cartão de crédito em até 12 vezes. O valor das parcelas é confirmado no orçamento."
    ],
    installments: [
      "Parcelamos no cartão de crédito em até 12 vezes.",
      "O parcelamento pode ser feito em até 12 vezes no cartão.",
      "Dá para dividir em até 12 vezes. A equipe confirma o valor de cada parcela."
    ],
    interest: [
      "Os acréscimos dependem da quantidade de parcelas. A equipe confirma na simulação.",
      "A condição muda conforme o número de parcelas. O vendedor informa o valor final antes do pagamento.",
      "Para confirmar juros ou valor sem juros, precisamos simular o pedido."
    ],
    boleto: [
      "Temos boleto por meio do banco, mas essa opção aumenta bastante o valor final.",
      "É possível simular boleto, porém ele encarece a compra e costuma compensar apenas para quem não tem outra forma de pagamento.",
      "O boleto bancário é feito sob consulta e possui um acréscimo elevado."
    ],
    cheque: [
      "A aceitação de cheque precisa ser confirmada pela equipe antes do pedido.",
      "Cheque não é uma condição automática. O vendedor precisa verificar antes do fechamento.",
      "Para pagamento em cheque, a equipe confirma primeiro se a condição está disponível."
    ],
    debit: [
      "O pagamento no débito precisa ser confirmado conforme o canal da compra.",
      "Para cartão de débito, a equipe verifica a condição disponível.",
      "Vou te encaminhar para confirmar o pagamento no débito."
    ],
    deliveryPayment: [
      "Nas peças feitas por encomenda, o pagamento é confirmado no pedido para iniciar a produção.",
      "Anéis e alianças sob medida entram em produção após a confirmação do pagamento.",
      "Para peças por encomenda, não deixamos todo o pagamento somente para a entrega."
    ],
    entry: [
      "A possibilidade de entrada e saldo depende do pedido e precisa ser confirmada pelo vendedor.",
      "A equipe verifica se há opção de entrada conforme o valor e a peça.",
      "Para pagar uma parte agora e outra depois, o atendimento precisa analisar o pedido."
    ],
    cashDiscount: [
      "A equipe verifica a melhor condição à vista no momento do orçamento.",
      "Pode haver condição especial à vista. O vendedor confirma conforme a peça.",
      "O desconto à vista depende do pedido e da promoção disponível."
    ],
    methods: [
      "Aceitamos Pix e cartão de crédito em até 12 vezes. Boleto é feito sob consulta e possui acréscimo.",
      "As principais formas são Pix e cartão de crédito parcelado em até 12 vezes.",
      "Você pode pagar por Pix ou cartão de crédito. Para boleto, entrada ou outras condições, a equipe faz uma simulação."
    ],
    other: [
      "Essa forma de pagamento precisa ser confirmada pela equipe.",
      "O vendedor verifica essa condição antes do fechamento.",
      "Vou te encaminhar para confirmar essa opção de pagamento."
    ]
  };

  const normalize = (value) => String(value || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  function classify(text){
    if(/\bpix\b/.test(text)) return "pix";
    if(/\b(cheque|cheques)\b/.test(text)) return "cheque";
    if(/\b(boleto|boletos|boletado)\b/.test(text)) return "boleto";
    if(/\b(debito)\b/.test(text)) return "debit";

    if(includesAny(text, [
      "pagar na entrega", "pagamento na entrega", "pagar quando chegar", "pago quando chegar",
      "pagar quando receber", "pago quando receber", "contra entrega"
    ])) return "deliveryPayment";

    if(includesAny(text, [
      "dar entrada", "valor de entrada", "quanto de entrada", "entrada e o restante",
      "pagar uma entrada", "pagar metade", "metade agora", "entrada mais parcelas", "sinal"
    ])) return "entry";

    if(includesAny(text, [
      "desconto a vista", "desconto no pix", "valor a vista", "melhor valor a vista",
      "a vista fica quanto", "tem desconto pagando a vista"
    ])) return "cashDiscount";

    if(includesAny(text, ["tem juros", "sem juros", "com juros", "juros do cartao", "acrescimo nas parcelas"])) return "interest";

    if(includesAny(text, [
      "em quantas vezes", "quantas vezes", "quantas parcelas", "numero de parcelas",
      "ate quantas vezes", "parcela em quantas", "parcelam", "parcelamento"
    ])) return "installments";

    if(/\b(cartao|credito)\b/.test(text)) return "credit";

    if(includesAny(text, [
      "formas de pagamento", "forma de pagamento", "como posso pagar", "como paga",
      "quais pagamentos", "meios de pagamento", "opcoes de pagamento", "aceitam o que"
    ])) return "methods";

    if(state.paymentContext && includesAny(text, ["e em quantas", "quantas", "vezes", "parcelas"])) return "installments";
    if(state.paymentContext && includesAny(text, ["juros", "sem juros", "acrescimo"])) return "interest";

    if(includesAny(text, [
      "dinheiro", "transferencia", "deposito", "ted", "doc", "paypal", "mercado pago"
    ])) return "other";

    return null;
  }

  function pick(topic){
    const list = replies[topic];
    let index;
    do index = Math.floor(Math.random() * list.length);
    while(index === state.last[topic] && list.length > 1);
    state.last[topic] = index;
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
    }catch(_){ state.phone = SALES[Math.random() < 0.5 ? 0 : 1]; }
    return state.phone;
  }

  function whatsappUrl(raw){
    const message = `Olá! Quero confirmar uma condição de pagamento. Minha dúvida: ${raw}`;
    return `https://api.whatsapp.com/send/?phone=${choosePhone()}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  function clock(){ return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date()); }
  function escapeHtml(value){ return value.replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }

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

  function addButton(raw){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    const link = document.createElement("a");
    card.className = "action-card compact-card";
    link.className = "action-btn wa";
    link.href = whatsappUrl(raw);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Confirmar pagamento";
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
    await new Promise((resolve) => setTimeout(resolve, 260));
    addMessage(pick(topic));
    state.paymentContext = true;
    if(!["pix", "deliveryPayment"].includes(topic)) addButton(raw);
    state.busy = false;
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

  window.__pagamentoV2 = {normalize, classify, replies, state};
})();
