(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const state = { last: {}, busy: false, paymentContext: false, phone: null };

  const replies = {
    pix: [
      "Aceitamos Pix, sim.",
      "Sim, o pagamento pode ser feito por Pix.",
      "Trabalhamos com Pix. A equipe envia os dados no fechamento do pedido."
    ],
    card: [
      "Aceitamos cartão e parcelamos em até 12 vezes. A equipe confirma o valor das parcelas.",
      "Sim. O pagamento no cartão pode ser dividido em até 12 vezes.",
      "Trabalhamos com cartão em até 12 vezes, conforme o valor do pedido."
    ],
    installments: [
      "Parcelamos no cartão em até 12 vezes. O vendedor confirma o valor de cada parcela.",
      "Dá para parcelar em até 12 vezes no cartão.",
      "O parcelamento pode ser feito em até 12 vezes. A condição final é confirmada no orçamento."
    ],
    boleto: [
      "Temos boleto por meio do banco, mas essa opção aumenta bastante o valor final.",
      "É possível simular boleto, porém ele encarece a compra e costuma compensar apenas para quem não tem outra forma de pagamento.",
      "Trabalhamos com boleto bancário sob consulta. Como há um acréscimo alto, a equipe faz a simulação antes."
    ],
    cheque: [
      "A aceitação de cheque precisa ser confirmada pela equipe antes do pedido.",
      "Para pagamento em cheque, o vendedor precisa verificar a condição disponível.",
      "Cheque não é uma condição automática. A equipe confirma antes do fechamento."
    ],
    deliveryPayment: [
      "Nas peças feitas por encomenda, o pagamento é realizado no fechamento para iniciar a produção. Não fica somente para a entrega.",
      "Para começarmos uma peça sob medida, o pagamento é confirmado no momento do pedido.",
      "Anéis e alianças por encomenda entram em produção após a confirmação do pagamento."
    ],
    entry: [
      "A condição de entrada depende do pedido e precisa ser confirmada pelo vendedor.",
      "A equipe verifica se há possibilidade de entrada conforme o valor e a peça.",
      "Para entrada e saldo, o atendimento precisa analisar o pedido antes de confirmar."
    ],
    methods: [
      "Aceitamos Pix e cartão em até 12 vezes. Também há boleto bancário sob consulta, mas com acréscimo elevado.",
      "As principais formas são Pix e cartão parcelado em até 12 vezes. Boleto é analisado separadamente.",
      "Você pode pagar por Pix ou cartão. Para boleto, entrada ou outras condições, a equipe faz uma simulação."
    ],
    other: [
      "Essa forma de pagamento precisa ser confirmada pela equipe.",
      "O vendedor verifica essa condição antes do fechamento.",
      "Vou te encaminhar para confirmar essa opção de pagamento."
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
    if(/\b(pix)\b/.test(text)) return "pix";
    if(/\b(cheque|cheques)\b/.test(text)) return "cheque";
    if(/\b(boleto|boletos|boletado)\b/.test(text)) return "boleto";

    if(includesAny(text, [
      "pagar na entrega", "pagamento na entrega", "pago quando chegar", "pagar quando chegar",
      "pagar quando receber", "pago quando receber", "contra entrega"
    ])) return "deliveryPayment";

    if(includesAny(text, [
      "dar entrada", "valor de entrada", "quanto de entrada", "entrada e o restante",
      "pagar uma entrada", "entrada mais parcelas", "sinal"
    ])) return "entry";

    if(includesAny(text, [
      "em quantas vezes", "quantas vezes", "quantas parcelas", "numero de parcelas",
      "ate quantas vezes", "parcela em quantas", "parcelam", "parcelamento"
    ])) return "installments";

    if(/\b(cartao|credito|debito)\b/.test(text)) return "card";

    if(includesAny(text, [
      "formas de pagamento", "forma de pagamento", "como posso pagar", "como paga",
      "quais pagamentos", "meios de pagamento", "opcoes de pagamento", "aceitam o que"
    ])) return "methods";

    if(state.paymentContext && includesAny(text, [
      "e em quantas", "quantas", "vezes", "parcelas", "tem juros", "sem juros"
    ])) return "installments";

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
    }catch(_){
      state.phone = SALES[Math.random() < 0.5 ? 0 : 1];
    }
    return state.phone;
  }

  function whatsappUrl(raw){
    const message = `Olá! Quero confirmar uma condição de pagamento. Minha dúvida: ${raw}`;
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

  function addButton(raw){
    const messages = document.querySelector("#messages");
    if(!messages) return;
    const card = document.createElement("div");
    card.className = "action-card compact-card";
    const link = document.createElement("a");
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
    if(["boleto", "cheque", "entry", "methods", "other", "installments", "card"].includes(topic)) addButton(raw);

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

  window.__pagamentoV1 = {normalize, classify, replies, state};
})();
