(() => {
  "use strict";

  const CONFIG = Object.freeze({
    sales: ["5541995888995", "5541995776736"],
    evaluationAndRepairs: "5541998518452",
    brand: "Emporium24k"
  });

  const state = { salesAgent: null, lastTopic: null, busy: false };
  const $ = (s) => document.querySelector(s);
  const messages = $("#messages");
  const intro = $("#intro");
  const input = $("#question");

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ").trim();

  const hasAny = (text, terms) => terms.some((term) => text.includes(term));
  const hasWord = (text, words) => words.some((word) => new RegExp(`(^|\\s)${word}(\\s|$)`).test(text));

  function chooseSalesAgent(){
    if(state.salesAgent) return state.salesAgent;
    try{
      const arr = new Uint32Array(1); crypto.getRandomValues(arr);
      state.salesAgent = CONFIG.sales[arr[0] % CONFIG.sales.length];
    }catch(_){ state.salesAgent = CONFIG.sales[Math.random() < .5 ? 0 : 1]; }
    return state.salesAgent;
  }

  function classify(raw){
    const t = normalize(raw);
    if(!t) return "empty";

    const repair = ["conserto","concerto","concertar","consertar","consertam","concertam","arrumar","reparar","reparo","soldar","solda","quebrou","quebrada","quebrado","apertar pedra","pedra caiu","polimento","polir","banho","restaurar","ajustar aro","ajuste de aro","aumentar aro","diminuir aro","reformar joia"];
    const selling = ["quero vender","vender ouro","vender prata","vendo ouro","vendo prata","avaliar meu ouro","avaliar minha prata","avaliacao de ouro","avaliacao de prata","quanto voces pagam","quanto pagam","compram ouro","compram prata","compra de ouro","compra de prata","tenho ouro usado","tenho prata usada","ouro usado","prata usada","sucata de ouro","sucata de prata","joia usada","joias usadas","corrente usada","anel usado","alianca usada","peca usada","teste de teor","testar ouro","testar prata"];
    const unsupported = ["aco","tungstenio","titanio","latao","em cobre","compram cobre","vender cobre","trabalham com cobre","em bronze","compram bronze","vender bronze","rodio","bijuteria","alianca de moeda","feito de moeda","joia de moeda","compram moeda","vender moeda"];
    const personalization = ["personalizado","personalizada","personalizar","sob medida","do zero","igual a foto","igual a uma foto","igual uma foto","foto de referencia","desenho proprio","molde 3d","com iniciais","com nome","projeto exclusivo"];
    const goldPriceAmbiguous = ["preco do ouro","valor do ouro","quanto esta o ouro","cotacao do ouro","grama do ouro"];
    const commercial = ["quanto custa","qual valor","qual o valor","preco","orcamento","quanto fica","parcelamento","parcela","parcelam","desconto","promocao","comprar","quero uma","quero um","encomendar","fazer pedido","fazer um pedido","como pedir","catalogo","modelos disponiveis","tem disponivel","valor da alianca","valor das aliancas","quero alianca","quero aliancas","quero joia","quero joias","quero anel","quero pingente","quero corrente","quero pulseira","ver aliancas","ver joias","aliancas e joias","falar com especialista","falar com atendente","falar com vendedor","vendem ouro","vendem prata","vendem alianca","vendem aliancas","vendem joia","vendem joias","tem alianca","tem aliancas","tem joia","tem joias","quantas gramas","quanto pesa","peso da alianca","peso das aliancas","peso do anel"];

    if(hasAny(t, selling) || ((hasWord(t,["vender","avaliar"]) || hasAny(t,["para vender","para avaliacao"])) && hasAny(t,["ouro","prata","joia","joias","corrente","anel","alianca","pulseira","brinco","pingente","moeda"])) || (hasAny(t,["compram joia","compram joias"]) && !hasAny(t,["aco","tungstenio","titanio","cobre","bronze"]))) return "sell_gold_silver";
    if(hasAny(t, repair)) return "repair";
    if(hasAny(t, goldPriceAmbiguous)) return "gold_price_clarify";
    if(hasAny(t, unsupported)) return "unsupported_material";
    if(hasAny(t, personalization) && hasAny(t, commercial)) return "personalized_commercial";
    if(hasAny(t, personalization)) return "personalized";

    if(hasAny(t,["macica","macico","maciça","maciço","oca","oco"])) return "solid_or_hollow";
    if(hasAny(t,["largura","milimetros","milímetros","3mm","4mm","5mm","6mm","alianca fina","alianca larga"])) return "width_style";
    if(hasAny(t,["diferenca entre ouro e prata","ouro ou prata","melhor ouro ou prata","qual material escolher"])) return "material_comparison";
    if(hasAny(t,["pagamento","pix","cartao","cartão","boleto","entrada","pagar na entrega","pagamento na entrega","formas de pagamento"])) return "payment";
    if(hasAny(t,["frete","entrega","enviam","envio","todo brasil","fora de curitiba"])) return "shipping";
    if(hasAny(t,["gravacao","gravar","nome dentro","data dentro","frase dentro"])) return "engraving";
    if(hasAny(t,["ouro 18k","ouro e 18k","ouro 18 k","18 quilates","750","teor do ouro","ouro verdadeiro"])) return "gold18k";
    if(hasAny(t,["prata 925","teor da prata","prata verdadeira","prata escurece","prata fica preta","oxidacao da prata"])) return "silver925";
    if(hasAny(t,["garantia cobre","garantia de quebra","garantia da pedra","garantia do conserto","garantia de risco","garantia de riscos"])) return "warranty_scope";
    if(hasAny(t,["garantia","certificado","nota fiscal","autenticidade","procedencia","procedência"])) return "trust_docs";
    if(hasAny(t,["prazo","quanto tempo","dias uteis","fica pronto","produzir","producao"])) return "production_time";
    if(hasAny(t,["numeracao","numero do aro","tamanho do aro","medir o dedo","medida do dedo","qual aro","meu aro","aro do anel"])) return "ring_size";
    if(hasAny(t,["anatomica","anatomico","semi anatomica","semianatomica","interno reto","confort fit","comfort fit"])) return "comfort";
    if(hasAny(t,["ouro escurece","ouro escureceu","ouro fica preto","ouro ficou preto","ouro oxidou","ouro perdeu o brilho"])) return "gold_care";
    if(hasAny(t,["limpar","limpeza","cuidar","cuidados","escureceu","ficou preta","oxidou","manutencao","manutenção"])) return "care";
    if(hasAny(t,["diamante","pedra","zirconia","zircônia","safira","ametista","esmeralda","rubi","solitario","solitário"])) return "stones";
    if(hasAny(t,["onde fica","onde ficam","onde voces ficam","endereco","endereço","loja fisica","loja física","curitiba","bairro alto","empresa confiavel","empresa confiável","sao confiaveis","e confiavel","golpe","seguranca","segurança","avaliacoes google","avaliações google"])) return "location_trust";
    if(hasAny(t,["ouro 10k","10 quilates","ouro 14k","14 quilates"])) return "other_gold_karat";
    if(hasAny(t,["semi joia","semijoia","semijoias","banhada","folheada"]) && hasAny(t,commercial)) return "semijewelry_commercial";
    if(hasAny(t,["semi joia","semijoia","semijoias","banhada","folheada"])) return "semijewelry";
    if(hasAny(t,["alianca","alianças","aliancas","anel","joia","joias","pingente","corrente","pulseira"]) && (hasAny(t, commercial) || hasAny(t,["fazem","vendem","tem","trabalham com","quero","procuro"]))) return "commercial";
    if(hasAny(t, commercial)) return "commercial";
    if(hasWord(t,["oi","ola"]) || hasAny(t,["bom dia","boa tarde","boa noite","tudo bem"])) return "greeting";
    if(hasWord(t,["obrigado","obrigada","valeu","agradeco"])) return "thanks";
    return "unknown";
  }

  const RESPONSES = {
    greeting: { text:"Olá! Eu sou a <strong>Coroa 24K</strong>. Posso ajudar com alianças, ouro 18k, prata 925, personalizados, consertos, entrega ou avaliação de peças.", quick:["Quero alianças","Peça personalizada","Quero vender ouro","Preciso de conserto"] },
    personalized: { text:"Sim. A Emporium24k desenvolve peças personalizadas em <strong>ouro 18k ou prata 925</strong>, a partir de uma ideia, desenho ou foto de referência. O projeto passa por análise de viabilidade técnica antes do orçamento.", quick:["Quero orçamento do personalizado","Pode ser igual a uma foto?","Vocês fazem molde 3D?"] },
    personalized_commercial: { text:"Fazemos personalizados em ouro 18k ou prata 925. Para calcular corretamente, a equipe precisa analisar o tipo de peça, material, medidas, referência e prazo.", action:"sales", actionLabel:"Enviar projeto para orçamento" },
    shipping: { text:"O <strong>frete é gratuito para todo o Brasil</strong>, com rastreamento. Em Curitiba e região também pode haver entrega por motoboy, conforme disponibilidade e endereço.", quick:["Qual o prazo de produção?","Quero fazer um pedido"] },
    engraving: { text:"As <strong>gravações internas são gratuitas</strong> nas alianças compradas conosco. É possível gravar nomes, data ou uma frase curta, conforme o espaço disponível na peça.", quick:["Quero orçamento de alianças","Como saber a numeração?"] },
    gold18k: { text:"Trabalhamos com <strong>ouro 18k</strong>, que possui 75% de ouro puro e 25% de liga metálica para resistência. As peças acompanham nota fiscal, certificado e garantia permanente do teor.", quick:["Qual a diferença para ouro 10k?","Quero ver alianças de ouro"] },
    silver925: { text:"A prata 925 contém 92,5% de prata pura. Ela pode escurecer com o tempo por oxidação, o que é natural e não significa perda do teor. Trabalhamos com prata 925 e oferecemos garantia permanente do teor.", quick:["Como limpar prata?","Quero alianças de prata"] },
    trust_docs: { text:"As joias em ouro 18k e prata 925 acompanham <strong>nota fiscal e certificado</strong>. A Emporium24k oferece garantia permanente do teor do metal, dando segurança para testes futuros de autenticidade.", quick:["Onde vocês ficam?","Quero falar com vendedor"] },
    production_time: { text:"O prazo padrão de produção é de <strong>5 a 7 dias úteis</strong>, contado após a confirmação do pedido. Personalizados ou projetos complexos podem exigir prazo diferente, informado antes do fechamento.", quick:["O frete é grátis?","Quero confirmar meu prazo"] },
    ring_size: { text:"A numeração correta evita ajustes e desconforto. A melhor opção é medir com uma aneleira ou confirmar em uma joalheria. Medidas por régua, barbante ou foto podem gerar erro; a equipe pode orientar o procedimento mais seguro.", quick:["Interno reto ou anatômico?","Quero ajuda com a numeração"] },
    comfort: { text:"O <strong>interno reto</strong> tem a parte interna plana. O <strong>semianatômico</strong> possui leve curvatura. O <strong>anatômico</strong> tem curvatura interna mais acentuada e costuma oferecer maior conforto, especialmente em alianças largas.", quick:["Quero orçamento de alianças","Como saber a numeração?"] },
    care: { text:"O cuidado depende do material. Evite cloro, produtos químicos, impactos e atrito excessivo. Prata e semijoias podem escurecer; limpeza ou polimento inadequado pode danificar o acabamento. Para avaliar a peça com segurança, nossa equipe de consertos pode orientar.", action:"repair", actionLabel:"Falar sobre limpeza ou reparo" },
    stones: { text:"Trabalhamos com projetos com pedras, desde que o modelo seja tecnicamente viável. Tipo, tamanho, cravação e disponibilidade da pedra influenciam o orçamento, por isso a equipe precisa analisar a referência.", action:"sales", actionLabel:"Enviar referência para orçamento" },
    solid_or_hollow: { text:"O peso e a construção da peça — maciça ou oca — dependem do modelo escolhido. Essa informação deve aparecer claramente no orçamento e no pedido; a equipe comercial confirma o tipo exato antes da compra.", action:"sales", actionLabel:"Confirmar modelo e construção" },
    width_style: { text:"A largura muda o visual, o conforto, o peso e o valor da aliança. Modelos mais finos tendem a ser discretos; os mais largos têm presença maior. A melhor medida depende do estilo, numeração e orçamento do casal.", action:"sales", actionLabel:"Escolher largura com um especialista" },
    material_comparison: { text:"O ouro 18k é mais valioso, tem alta durabilidade e mantém valor de material. A prata 925 oferece um investimento inicial menor, mas pode oxidar e exige limpeza periódica. A escolha depende do orçamento e do uso esperado.", quick:["Quero alianças de ouro","Quero alianças de prata"] },
    payment: { text:"As condições de pagamento podem variar conforme o pedido e a campanha vigente. A produção começa após a confirmação do pagamento. Para receber as opções corretas, fale com o atendimento comercial.", action:"sales", actionLabel:"Consultar formas de pagamento" },
    location_trust: { text:"A Emporium24k é uma empresa de Curitiba, com atendimento físico no <strong>Bairro Alto</strong> e vendas para todo o Brasil. Trabalhamos com nota fiscal, certificado, garantia do teor e rastreamento do envio.", quick:["Quero falar com vendedor","O frete é grátis?"] },
    other_gold_karat: { text:"A Emporium24k trabalha exclusivamente com <strong>ouro 18k</strong> e prata 925. Não produzimos peças em ouro 10k ou 14k. O ouro 18k possui 75% de ouro puro e é o padrão tradicional da joalheria brasileira.", quick:["Quero alianças em ouro 18k","Qual o valor?"] },
    gold_care: { text:"O ouro 18k não costuma oxidar como a prata, mas a peça pode perder brilho ou aparentar escurecimento por resíduos, produtos químicos, suor ou alteração no acabamento. A causa deve ser avaliada antes de qualquer polimento.", action:"repair", actionLabel:"Enviar peça para avaliação" },
    warranty_scope: { text:"A garantia permanente da Emporium24k é sobre o <strong>teor do ouro 18k ou da prata 925</strong>. Quebras, riscos, pedras, deformações e desgastes dependem da causa e precisam de análise técnica para definir reparo e custo.", action:"repair", actionLabel:"Solicitar análise da garantia" },
    semijewelry_commercial: { text:"Temos opções de semijoias. Para conferir modelos, disponibilidade e valores atuais, o atendimento comercial apresenta as opções corretas.", action:"sales", actionLabel:"Ver semijoias no WhatsApp" },
    semijewelry: { text:"Também trabalhamos com semijoias e realizamos consertos quando a peça permite reparo. Para compra de produtos, fale com o comercial. Para conserto, o atendimento técnico analisa primeiro a peça.", quick:["Quero comprar semijoia","Preciso consertar semijoia"] },
    repair: { text:"Sim. Realizamos <strong>consertos de joias e semijoias</strong>, sujeitos à análise da peça e da viabilidade do reparo. Envie uma foto e explique o problema para a equipe responsável.", action:"repair", actionLabel:"Enviar peça para análise" },
    sell_gold_silver: { text:"Compramos e avaliamos itens de <strong>ouro e prata</strong>. O valor depende do teor, peso e análise da peça; por isso não é seguro fechar uma cotação apenas pelo chat. O atendimento de avaliação orienta os próximos passos.", action:"evaluation", actionLabel:"Avaliar ouro ou prata" },
    gold_price_clarify: { text:"Você quer saber o valor para <strong>comprar uma joia</strong> ou quer <strong>vender ouro para a Emporium24k</strong>?", quick:["Quero comprar joia de ouro","Quero vender meu ouro"] },
    unsupported_material: { text:"A Emporium24k trabalha exclusivamente com <strong>ouro 18k e prata 925</strong>. Não confeccionamos peças de moeda, aço, tungstênio, titânio, cobre, bronze ou outros metais, e também não compramos esses materiais.", quick:["Pode fazer em ouro 18k?","Pode fazer em prata 925?"] },
    commercial: { text:"Para informar preço com precisão, a equipe precisa considerar modelo, material, largura, peso, numeração, acabamento e prazo. Vou direcionar você ao atendimento comercial.", action:"sales", actionLabel:"Receber orçamento no WhatsApp" },
    thanks: { text:"Por nada! Quando precisar, é só me perguntar. Posso ajudar com alianças, personalizados, entrega, consertos ou avaliação de ouro e prata.", quick:["Quero alianças","Peça personalizada","Falar com atendente"] },
    unknown: { text:"Ainda não encontrei uma resposta segura para essa pergunta. Para não passar informação incompleta, você pode reformular ou falar diretamente com um especialista.", quick:["Alianças e joias","Vender ouro ou prata","Conserto","Falar com especialista"] }
  };

  function buildWhatsUrl(type, context){
    const phone = type === "sales" ? chooseSalesAgent() : CONFIG.evaluationAndRepairs;
    const introText = type === "sales" ? "Olá! Vim pelo assistente Coroa 24K e quero atendimento comercial." :
      type === "repair" ? "Olá! Vim pelo assistente Coroa 24K e preciso analisar um conserto de joia ou semijoia." :
      "Olá! Vim pelo assistente Coroa 24K e quero avaliar itens de ouro ou prata para venda.";
    const text = `${introText}\n\nMinha pergunta: ${context || "Quero mais informações."}`;
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
  }

  function addMessage(html, who="bot"){
    if(intro) intro.style.display = "none";
    const row = document.createElement("div"); row.className = `row ${who === "user" ? "user" : ""}`;
    if(who !== "user"){ const avatar = document.createElement("div"); avatar.className="avatar"; avatar.textContent="♛"; row.appendChild(avatar); }
    const bubble = document.createElement("div"); bubble.className="bubble"; bubble.innerHTML=html; row.appendChild(bubble); messages.appendChild(row); messages.scrollTop=messages.scrollHeight; return row;
  }

  function addQuick(items){
    const box=document.createElement("div"); box.className="quick";
    items.forEach(label=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",()=>handleQuestion(label));box.appendChild(b)});
    messages.appendChild(box);messages.scrollTop=messages.scrollHeight;
  }

  function addAction(type,label,context){
    const card=document.createElement("div");card.className="action-card";
    const p=document.createElement("p");p.textContent=type==="sales"?"Você será direcionado a um dos atendentes comerciais.":type==="repair"?"O reparo depende da análise da peça.":"A avaliação depende de teste, teor e peso.";
    const a=document.createElement("a");a.className="wa";a.target="_blank";a.rel="noopener noreferrer";a.href=buildWhatsUrl(type,context);a.textContent=`◉ ${label}`;a.addEventListener("click",()=>track("whatsapp_click",{type,topic:state.lastTopic}));card.append(p,a);messages.appendChild(card);messages.scrollTop=messages.scrollHeight;
  }

  function showTyping(){
    const row=addMessage('<span class="typing"><span></span><span></span><span></span></span>');return()=>row.remove();
  }

  function saveUnknown(question){
    try{const key="emporium24k_unknown_questions";const list=JSON.parse(localStorage.getItem(key)||"[]");list.push({question,at:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(list.slice(-100)));}catch(_){}
  }

  function track(name,detail){
    try{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name,...detail});window.dispatchEvent(new CustomEvent(`emporium:${name}`,{detail}));}catch(_){}
  }

  async function handleQuestion(raw){
    const question=String(raw||"").trim();if(!question||state.busy)return;state.busy=true;input.value="";addMessage(question.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])),"user");
    const stop=showTyping();await new Promise(r=>setTimeout(r,260));stop();
    const topic=classify(question);state.lastTopic=topic;const response=RESPONSES[topic]||RESPONSES.unknown;addMessage(response.text);if(topic==="unknown")saveUnknown(question);if(response.quick)addQuick(response.quick);if(response.action)addAction(response.action,response.actionLabel,question);track("assistant_answer",{topic});state.busy=false;input.focus();
  }

  $("#composer").addEventListener("submit",e=>{e.preventDefault();handleQuestion(input.value)});
  $("#topCta").addEventListener("click",()=>{addMessage("Quero falar com um especialista","user");addMessage("Certo. Vou direcionar você ao atendimento comercial.");addAction("sales","Abrir atendimento no WhatsApp","Quero falar com um especialista.")});

  addMessage("Olá! Eu sou a <strong>Coroa 24K</strong>. Posso responder suas dúvidas e encaminhar você para a equipe certa.");
  addQuick(["Quero alianças","Peça personalizada","Quero vender ouro","Preciso de conserto","Frete e entrega"]);

  window.__assistant = { normalize, classify, buildWhatsUrl, RESPONSES, CONFIG };

  function runSelfTests(){
    const tests = [
      ["quanto custa um par de alianças?","commercial"],["qual o valor das alianças de ouro?","commercial"],["quero um orçamento","commercial"],
      ["quero vender uma corrente de ouro","sell_gold_silver"],["quanto vocês pagam na grama da prata?","sell_gold_silver"],["vocês compram ouro usado?","sell_gold_silver"],
      ["quanto está o ouro hoje?","gold_price_clarify"],["qual a cotação do ouro?","gold_price_clarify"],
      ["vocês consertam joias?","repair"],["concertam semijoias?","repair"],["minha corrente quebrou","repair"],
      ["fazem anel personalizado?","personalized"],["quero orçamento de pingente personalizado","personalized_commercial"],["fazem igual a uma foto?","personalized"],
      ["fazem aliança de moeda?","unsupported_material"],["trabalham com tungstênio?","unsupported_material"],["compram cobre?","unsupported_material"],
      ["o frete é grátis?","shipping"],["enviam para todo brasil?","shipping"],["a gravação é gratuita?","engraving"],
      ["o ouro é 18k?","gold18k"],["prata 925 escurece?","silver925"],["tem certificado e nota fiscal?","trust_docs"],
      ["quanto tempo para ficar pronto?","production_time"],["como descubro meu aro?","ring_size"],["qual diferença do anatômico?","comfort"],
      ["como limpar minha aliança?","care"],["trabalham com diamante?","stones"],["aceitam pix?","payment"],
      ["onde fica a loja?","location_trust"],["fazem ouro 10k?","other_gold_karat"],["vocês vendem semijoias?","semijewelry"],
      ["oi bom dia","greeting"],["obrigado pela ajuda","thanks"],["qual a temperatura em marte?","unknown"]
    ];
    const failures=[];for(const [q,expected] of tests){const got=classify(q);if(got!==expected)failures.push({q,expected,got});}
    const responseMissing=[...new Set(tests.map(x=>x[1]))].filter(k=>!RESPONSES[k]);
    const urls={sales:buildWhatsUrl("sales","teste"),evaluation:buildWhatsUrl("evaluation","teste"),repair:buildWhatsUrl("repair","teste")};
    const checks={total:tests.length,passed:tests.length-failures.length,failures,responseMissing,urls,
      salesPhoneOk:CONFIG.sales.some(p=>urls.sales.includes(p)),evaluationPhoneOk:urls.evaluation.includes(CONFIG.evaluationAndRepairs),repairPhoneOk:urls.repair.includes(CONFIG.evaluationAndRepairs)};
    const el=$("#test-results");el.style.display="block";el.textContent=JSON.stringify(checks,null,2);document.title=failures.length||responseMissing.length?"TEST_FAIL":"TEST_OK";
  }
  if(new URLSearchParams(location.search).has("test")) runSelfTests();
})();
