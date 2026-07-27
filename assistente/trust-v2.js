(() => {
  "use strict";

  const SALES = ["5541995888995", "5541995776736"];
  const testimonials = "https://www.emporium24k.com.br/depoimentos/";
  const googleReviews = "https://www.google.com/maps/search/?api=1&query=Emporium24k%20Curitiba";
  const state = { busy: false, phone: null, last: {} };

  const replies = {
    materials: {
      short: [
        "Nas joias em ouro, trabalhamos com ouro 18k e damos garantia vitalícia do teor. O tipo da pedra é confirmado conforme o modelo.",
        "O ouro das nossas joias é 18k, com certificado e garantia vitalícia do teor. As pedras são informadas conforme cada peça."
      ],
      medium: [
        "Nossas joias em ouro são produzidas em ouro 18k e acompanham certificado, nota fiscal e garantia vitalícia do teor. As pedras variam conforme o modelo, e a equipe confirma antes do pedido se são naturais, sintéticas ou zircônias.",
        "Trabalhamos exclusivamente com ouro 18k nas joias, com documentação e garantia vitalícia do teor. Sobre as pedras, o material exato é informado no orçamento de cada modelo para você saber exatamente o que está comprando."
      ],
      detailed: [
        "Nas joias em ouro, trabalhamos exclusivamente com ouro 18k. A peça acompanha certificado de garantia do teor, nota fiscal e garantia vitalícia quanto ao material, comprovando que o ouro utilizado corresponde ao informado no pedido. Sobre as pedras, o tipo depende de cada modelo ou projeto: podem ser naturais, sintéticas ou zircônias. Por isso, a equipe confirma exatamente qual pedra será utilizada antes da compra, e quando ela for natural essa informação é especificada no orçamento ou na descrição da peça.",
        "Para garantir a segurança da compra, nossas joias em ouro são feitas em ouro 18k e entregues com nota fiscal, certificado e garantia vitalícia do teor. Já as pedras precisam ser verificadas peça por peça, pois nem todo modelo utiliza pedra natural. Antes de fechar o pedido, informamos se a pedra é natural, sintética ou zircônia, evitando qualquer dúvida sobre a composição da joia."
      ]
    },
    documents: {
      short: [
        "As joias acompanham nota fiscal, certificado e garantia vitalícia no teor do ouro 18k ou da prata 925.",
        "Você recebe nota fiscal, certificado e garantia vitalícia do teor do material."
      ],
      medium: [
        "As joias acompanham nota fiscal e certificado, além da garantia vitalícia no teor do ouro 18k ou da prata 925. Assim, a compra e o material da peça ficam documentados.",
        "Emitimos nota fiscal e fornecemos certificado da peça. Para ouro 18k e prata 925, também oferecemos garantia vitalícia do teor do material."
      ],
      detailed: [
        "A compra é documentada com nota fiscal e certificado da peça. Nas joias em ouro 18k ou prata 925, oferecemos garantia vitalícia do teor do material, garantindo que a composição recebida corresponda ao que foi informado no pedido. Caso sua dúvida envolva também pedras, cravações ou algum detalhe específico, a equipe confirma esses itens separadamente no orçamento.",
        "Para dar segurança, cada joia acompanha nota fiscal e certificado, e o ouro 18k ou a prata 925 possuem garantia vitalícia do teor. Isso cobre a autenticidade do material informado. Outros componentes da peça, como pedras e acabamentos, são descritos conforme o modelo escolhido e confirmados antes da produção."
      ]
    },
    trust: {
      short: [
        "Somos uma empresa registrada, com loja física em Curitiba, nota fiscal, certificado e avaliações de clientes.",
        "Você pode conferir nosso endereço, CNPJ, depoimentos e avaliações antes de comprar."
      ],
      medium: [
        "A Emporium24k é uma empresa registrada, com atendimento físico em Curitiba. Os pedidos acompanham nota fiscal e certificado, e você também pode conferir depoimentos e avaliações de clientes.",
        "É normal querer confirmar antes de comprar. Temos CNPJ ativo, endereço físico, documentação das peças e avaliações públicas para você consultar."
      ],
      detailed: [
        "Entendemos a preocupação, principalmente em uma compra de valor maior. A Emporium24k é uma empresa registrada, com atendimento físico em Curitiba, emissão de nota fiscal e certificado das joias. Os envios são rastreados, e você pode conferir depoimentos de clientes e avaliações públicas antes de concluir o pedido.",
        "Para tornar a compra mais segura, disponibilizamos informações da empresa, atendimento presencial em Curitiba, nota fiscal, certificado e rastreamento do envio. Além disso, você pode conferir avaliações e experiências de outros clientes antes de decidir, e falar diretamente com um atendente para validar qualquer detalhe do pedido."
      ]
    },
    reviews: {
      short: [
        "Temos depoimentos no site e avaliações no Google para você conferir.",
        "Você pode consultar depoimentos e avaliações de clientes antes de comprar."
      ],
      medium: [
        "Você pode conferir a experiência de outros clientes nos depoimentos do nosso site e nas avaliações do Google. Vou deixar os dois acessos para consulta.",
        "Temos relatos de clientes no site e avaliações públicas no Google, permitindo verificar a experiência de quem já comprou conosco."
      ],
      detailed: [
        "A melhor forma de conhecer a experiência de quem já comprou é consultar fontes públicas. Temos depoimentos de clientes reunidos no site e avaliações no Google. Vou deixar os dois acessos para você comparar os relatos e comprar com mais tranquilidade.",
        "Você pode verificar nossa reputação antes de decidir. Disponibilizamos depoimentos no site e também temos avaliações públicas no Google, onde é possível ler comentários de clientes e conferir as experiências relatadas por eles."
      ]
    },
    company: {
      short: [
        "Temos CNPJ ativo e atendimento físico no Bairro Alto, em Curitiba.",
        "A Emporium24k é uma empresa registrada e atende presencialmente em Curitiba."
      ],
      medium: [
        "A Emporium24k é uma empresa registrada, com CNPJ ativo, site oficial e atendimento físico no Bairro Alto, em Curitiba. Também emitimos nota fiscal.",
        "Temos endereço físico em Curitiba, CNPJ ativo e emissão de nota fiscal. Você pode visitar a loja ou consultar nossos depoimentos antes de comprar."
      ],
      detailed: [
        "A Emporium24k é uma empresa registrada, com CNPJ ativo, site oficial e atendimento físico no Bairro Alto, em Curitiba. Emitimos nota fiscal e fornecemos a documentação das joias. Você também pode conferir nosso endereço e os depoimentos de clientes antes de fechar qualquer pedido.",
        "Sim, temos operação formal e atendimento presencial em Curitiba. A empresa possui CNPJ ativo, endereço físico, site oficial e emissão de nota fiscal. Para aumentar sua segurança, você pode confirmar esses dados, visitar a loja e consultar experiências de outros clientes."
      ]
    },
    purchase: {
      short: [
        "O pedido acompanha nota fiscal, certificado e rastreamento do envio.",
        "A compra é documentada e o envio pode ser acompanhado pelo rastreio."
      ],
      medium: [
        "Para dar segurança, o pedido acompanha nota fiscal e certificado, e o envio é feito com rastreamento. Você também pode conferir nossas avaliações antes de concluir.",
        "A compra fica documentada, e o envio possui código de rastreio. Também temos atendimento físico em Curitiba e avaliações públicas."
      ],
      detailed: [
        "Entendemos o receio de pagar antes em uma compra online. O pedido é formalizado, acompanha nota fiscal e certificado, e o envio é feito com código de rastreio. Antes de fechar, você ainda pode consultar avaliações, depoimentos e os dados da empresa, além de falar diretamente com um atendente.",
        "Para reduzir o risco da compra à distância, fornecemos nota fiscal e certificado, mantemos atendimento físico em Curitiba e enviamos o pedido com rastreamento. Você também pode verificar avaliações de clientes e confirmar todos os detalhes com a equipe antes do pagamento."
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

  function classify(text){
    const mentionsGold = /\b(ouro|18k|quilates|teor)\b/.test(text);
    const mentionsStone = /\b(pedra|pedras|diamante|diamantes|zirconia|zirconias|safira|safiras|rubi|rubis|esmeralda|esmeraldas)\b/.test(text);
    const asksAuthenticity = includesAny(text, [
      "legitimo", "legitima", "verdadeiro", "verdadeira", "natural", "naturais",
      "autenticidade", "procedencia", "como comprovar", "como saber", "qual a garantia"
    ]);

    if((mentionsGold || mentionsStone) && asksAuthenticity) return "materials";
    if(includesAny(text,["pedra natural","pedras naturais","diamante natural","pedra verdadeira","pedras verdadeiras"])) return "materials";
    if(includesAny(text,["depoimento","avaliacao","avaliacoes","estrelas no google","nota no google","feedback","opinioes dos clientes","quem ja comprou"])) return "reviews";
    if(includesAny(text,["cnpj","empresa registrada","empresa existe","voces existem","loja fisica","endereco fisico","onde fica a loja","posso visitar","atendimento presencial"])) return "company";
    if(includesAny(text,["como sei que vou receber","se nao chegar","pagar antes","pagamento antecipado","medo de pagar","receio de pagar","compra segura","seguro comprar online","como posso ter certeza"])) return "purchase";
    if(includesAny(text,["nota fiscal","certificado","autenticidade","procedencia","garantia do teor","ouro verdadeiro","prata verdadeira","qual a garantia","garantia das joias"])) return "documents";
    if(includesAny(text,["confiavel","confianca","posso confiar","da para confiar","e seguro","seguro comprar","golpe","receio","desconfianca","empresa seria","medo de comprar"])) return "trust";
    return null;
  }

  function detailLevel(raw, normalized){
    const words = normalized.split(" ").filter(Boolean).length;
    const concepts = [
      /\b(garantia|garantem|garante)\b/,
      /\b(ouro|18k|prata|925|teor)\b/,
      /\b(pedra|pedras|diamante|zirconia|safira|rubi|esmeralda)\b/,
      /\b(natural|naturais|legitimo|legitima|verdadeiro|verdadeira|autenticidade|procedencia)\b/,
      /\b(certificado|nota fiscal|documento|comprovar)\b/,
      /\b(receber|envio|rastreio|pagamento|seguro|confiar)\b/
    ].filter((pattern) => pattern.test(normalized)).length;

    if(words >= 10 || raw.length >= 72 || concepts >= 3) return "detailed";
    if(words >= 5 || raw.length >= 36 || concepts >= 2) return "medium";
    return "short";
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
    const message = `Olá! Quero confirmar a garantia, o material e os detalhes da peça. Minha dúvida: ${raw}`;
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
    const level = detailLevel(raw, normalized);
    addMessage(pick(topic, level));

    if(topic === "materials") addLink(whatsappUrl(raw), "Confirmar material e pedras", "wa");
    if(["trust", "reviews", "purchase"].includes(topic)){
      addLink(testimonials, "Ver depoimentos");
      addLink(googleReviews, "Ver avaliações no Google");
    }else if(topic === "company"){
      addLink(testimonials, "Ver depoimentos");
    }

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

  window.__trustV2 = {normalize, classify, detailLevel, replies};
})();