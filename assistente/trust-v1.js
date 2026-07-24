(() => {
  "use strict";

  const testimonials = "https://www.emporium24k.com.br/depoimentos/";
  const googleReviews = "https://www.google.com/maps/search/?api=1&query=Emporium24k%20Curitiba";
  const last = {};
  let busy = false;

  const normalize = (value) => String(value || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  const includesAny = (text, list) => list.some((item) => text.includes(item));

  const replies = {
    trust: [
      "Pode ficar tranquilo: temos CNPJ ativo, atendimento físico em Curitiba, nota fiscal e certificado. Também temos avaliações 5 estrelas no Google.",
      "A Emporium24k é uma empresa registrada, com atendimento físico em Curitiba e avaliações de clientes para você conferir.",
      "Trabalhamos com nota fiscal, certificado e garantia do teor, além de depoimentos reais e avaliações 5 estrelas.",
      "É normal querer confirmar antes de comprar. Temos CNPJ ativo desde 2019, endereço físico e histórico de clientes.",
      "A compra é documentada e o envio é rastreado. Você também pode conferir nossas avaliações antes de decidir."
    ],
    reviews: [
      "Temos depoimentos reais no site e avaliações 5 estrelas no Google. Vou deixar os links para você conferir.",
      "Você pode conferir a experiência de outros clientes nos depoimentos do site e nas avaliações do Google.",
      "A melhor prova é a experiência de quem já comprou. Temos depoimentos no site e avaliações no Google.",
      "Claro. Vou deixar os depoimentos e as avaliações para você conferir.",
      "Temos vários relatos de clientes no site e uma ótima avaliação no Google."
    ],
    company: [
      "Temos CNPJ ativo desde 2019 e atendimento físico no Bairro Alto, em Curitiba. Também emitimos nota fiscal.",
      "A Emporium24k é uma empresa registrada, com endereço físico em Curitiba e CNPJ ativo.",
      "Sim, a empresa existe e atende presencialmente em Curitiba. Os pedidos acompanham nota fiscal.",
      "Somos uma empresa de Curitiba, com CNPJ ativo, site oficial e atendimento físico.",
      "Você pode confirmar nossos dados, endereço e depoimentos antes de fechar o pedido."
    ],
    purchase: [
      "Entendo o receio. O pedido acompanha nota fiscal, certificado e rastreamento. Você também pode conferir nossas avaliações.",
      "Para dar segurança, emitimos nota fiscal, enviamos com rastreamento e fornecemos certificado da peça.",
      "Você pode conferir depoimentos, avaliações 5 estrelas e falar com a equipe antes de concluir o pedido.",
      "A compra é documentada e o envio é rastreado. Também temos atendimento físico em Curitiba.",
      "Antes de fechar, você pode verificar nossas avaliações, depoimentos e dados da empresa."
    ],
    documents: [
      "As joias acompanham nota fiscal e certificado. Ouro 18k e prata 925 têm garantia vitalícia no teor.",
      "Emitimos nota fiscal e fornecemos certificado da peça, além da garantia do teor do ouro ou da prata.",
      "Você recebe nota fiscal, certificado e garantia vitalícia no teor do material.",
      "Toda joia é entregue com documentação para comprovar a compra e o teor do material.",
      "A nota fiscal e o certificado acompanham a peça, trazendo mais segurança para a compra."
    ]
  };

  function classify(text){
    if(includesAny(text,["depoimento","avaliacao","avaliacoes","estrelas no google","nota no google","feedback","opinioes dos clientes","quem ja comprou"])) return "reviews";
    if(includesAny(text,["cnpj","empresa registrada","empresa existe","voces existem","loja fisica","endereco fisico","onde fica a loja","posso visitar","atendimento presencial"])) return "company";
    if(includesAny(text,["como sei que vou receber","se nao chegar","pagar antes","pagamento antecipado","medo de pagar","receio de pagar","compra segura","seguro comprar online","como posso ter certeza"])) return "purchase";
    if(includesAny(text,["nota fiscal","certificado","autenticidade","procedencia","garantia do teor","ouro verdadeiro","prata verdadeira"])) return "documents";
    if(includesAny(text,["confiavel","confianca","posso confiar","da para confiar","e seguro","seguro comprar","golpe","receio","desconfianca","empresa seria","medo de comprar"])) return "trust";
    return null;
  }

  function pick(topic){
    const list = replies[topic];
    let index;
    do index = Math.floor(Math.random() * list.length);
    while(index === last[topic]);
    last[topic] = index;
    return list[index];
  }

  function clock(){ return new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(new Date()); }
  function escapeHtml(value){ return value.replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }

  function addMessage(html, who="bot"){
    const messages=document.querySelector("#messages"), intro=document.querySelector("#intro");
    if(!messages) return;
    if(intro) intro.style.display="none";
    const row=document.createElement("div"); row.className=`row ${who==="user"?"user":""}`;
    if(who!=="user"){ const avatar=document.createElement("div"); avatar.className="avatar"; avatar.textContent="♛"; row.appendChild(avatar); }
    const stack=document.createElement("div"), bubble=document.createElement("div"), meta=document.createElement("div");
    stack.className="message-stack"; bubble.className="bubble"; meta.className="bubble-meta";
    bubble.innerHTML=html; meta.textContent=who==="user"?clock():`Coroa 24K · ${clock()}`;
    stack.append(bubble,meta); row.appendChild(stack); messages.appendChild(row); messages.scrollTop=messages.scrollHeight;
  }

  function addLink(url,label){
    const messages=document.querySelector("#messages"); if(!messages) return;
    const card=document.createElement("div"), link=document.createElement("a");
    card.className="action-card store-card compact-card"; link.className="action-btn store";
    link.href=url; link.target="_blank"; link.rel="noopener noreferrer"; link.textContent=label;
    card.appendChild(link); messages.appendChild(card); messages.scrollTop=messages.scrollHeight;
  }

  async function answer(raw,topic){
    if(busy) return; busy=true;
    const input=document.querySelector("#question"); if(input) input.value="";
    addMessage(escapeHtml(raw),"user"); await new Promise((r)=>setTimeout(r,280)); addMessage(pick(topic));
    if(["trust","reviews","purchase"].includes(topic)){ addLink(testimonials,"Ver depoimentos"); addLink(googleReviews,"Ver avaliações no Google"); }
    else if(topic==="company") addLink(testimonials,"Ver depoimentos");
    busy=false; if(input) input.focus();
  }

  document.addEventListener("DOMContentLoaded",()=>{
    const form=document.querySelector("#composer"), input=document.querySelector("#question"); if(!form||!input) return;
    form.addEventListener("submit",(event)=>{
      const raw=String(input.value||"").trim(), topic=classify(normalize(raw)); if(!topic) return;
      event.preventDefault(); event.stopImmediatePropagation(); answer(raw,topic);
    },true);
  });

  window.__trustV1={normalize,classify,replies};
})();
