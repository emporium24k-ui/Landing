(() => {
  "use strict";

  const CONFIG = Object.freeze({
    sales: ["5541995888995", "5541995776736"],
    evaluationAndRepairs: "5541998518452",
    store: {
      home: "https://www.emporium24k.com.br/",
      products: "https://www.emporium24k.com.br/produtos/",
      semijewelry: "https://www.emporium24k.com.br/semijoias/",
      alliances: "https://www.emporium24k.com.br/aliancas/",
      silverAlliances: "https://www.emporium24k.com.br/aliancas/prata/",
      goldAlliances: "https://www.emporium24k.com.br/aliancas/ouro-18k/",
      goldChains: "https://www.emporium24k.com.br/joias/masculino1/ouro-18k1/correntes/",
      warranty: "https://www.emporium24k.com.br/garantia-emporium24k/",
      platedInfo: "https://www.emporium24k.com.br/o-que-e-uma-peca-banhada/"
    }
  });

  const state = { salesAgent: null, lastTopic: null, busy: false };
  const $ = (selector) => document.querySelector(selector);
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
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);
      state.salesAgent = CONFIG.sales[random[0] % CONFIG.sales.length];
    }catch(_){
      state.salesAgent = CONFIG.sales[Math.random() < 0.5 ? 0 : 1];
    }
    return state.salesAgent;
  }

  function classify(raw){
    const text = normalize(raw);
    if(!text) return "empty";

    const repairIntent = [
      "conserto","concerto","concertar","consertar","consertam","concertam","arrumar","arrumam",
      "reparar","reparam","reparo","soldar","solda","quebrou","quebrada","quebrado","apertar pedra","pedra caiu",
      "polimento","polir","banho de novo","novo banho","restaurar","ajustar aro","ajuste de aro",
      "aumentar aro","diminuir aro","reformar joia"
    ];
    const jewelryRepairTargets = [
      "joia","joias","semijoia","semijoias","semi joia","semi joias","alianca","aliancas","anel","aneis",
      "solitario","solitarios","corrente","correntes","colar","colares","pulseira","pulseiras","brinco","brincos",
      "pingente","pingentes","tornozeleira","tornozeleiras","piercing","piercings","escapulario","escapularios",
      "ouro","prata","pedra","zirconia","diamante","aro","folheado","folheada","banhado","banhada"
    ];
    const nonJewelryRepairTargets = [
      "relogio","relogios","smartwatch","carro","carros","automovel","automoveis","moto","motos","motocicleta",
      "aviao","avioes","aeronave","aeronaves","panela","panelas","talher","talheres","vaso","vasos","porta",
      "janela","movel","moveis","cadeira","mesa","celular","celulares","telefone","telefones","computador",
      "computadores","notebook","notebooks","televisao","televisor","tv","bicicleta","bicicletas","sapato",
      "sapatos","bolsa","bolsas","roupa","roupas","eletrodomestico","eletrodomesticos","geladeira","fogao",
      "microondas","maquina de lavar","instrumento","instrumentos","oculos"
    ];
    const unsupportedMetals = [
      "aco","tungstenio","titanio","latao","cobre","bronze","rodio","bijuteria","alianca de moeda","anel de moeda",
      "feito de moeda","joia de moeda","compram moeda","vender moeda"
    ];
    const selling = [
      "quero vender","vender ouro","vender prata","vendo ouro","vendo prata","avaliar meu ouro","avaliar minha prata",
      "avaliacao de ouro","avaliacao de prata","quanto voces pagam","quanto pagam","compram ouro","compram prata",
      "compra de ouro","compra de prata","tenho ouro usado","tenho prata usada","ouro usado","prata usada",
      "sucata de ouro","sucata de prata","joia usada","joias usadas","corrente usada","anel usado","alianca usada",
      "peca usada","teste de teor","testar ouro","testar prata"
    ];
    const personalization = [
      "personalizado","personalizada","personalizar","sob medida","do zero","igual a foto","igual a uma foto",
      "igual uma foto","foto de referencia","desenho proprio","molde 3d","com iniciais","com nome","projeto exclusivo"
    ];
    const goldPriceAmbiguous = ["preco do ouro","valor do ouro","quanto esta o ouro","cotacao do ouro","grama do ouro"];
    const ringTerms = ["alianca","aliancas","anel","aneis","solitario","solitarios"];
    const purchaseTerms = [
      "quanto custa","qual valor","qual o valor","preco","orcamento","quanto fica","parcelamento","parcela","parcelam",
      "desconto","promocao","comprar","quero uma","quero um","encomendar","fazer pedido","fazer um pedido","como pedir",
      "catalogo","modelos disponiveis","tem disponivel","valor da alianca","valor das aliancas","valor do anel","quero alianca",
      "quero aliancas","quero joia","quero joias","quero anel","ver aliancas","ver joias","falar com especialista",
      "falar com atendente","falar com vendedor","quero falar com um especialista","quero falar com um atendente",
      "vendem ouro","vendem prata","vendem alianca","vendem aliancas","vendem joia","vendem joias","tem alianca",
      "tem aliancas","tem joia","tem joias","quantas gramas","quanto pesa","peso da alianca","peso das aliancas","peso do anel"
    ];
    const stockTerms = [
      "estoque","em estoque","pronta entrega","pronto entrega","disponivel agora","disponiveis agora","entrega imediata",
      "comprar pronto","quais produtos tem","o que tem disponivel","ver produtos","loja online","loja oficial","site da loja",
      "comprar pelo site","catalogo online"
    ];
    const semijewelryTerms = ["semi joia","semijoia","semijoias","banhada","banhado","folheada","folheado"];
    const readyProductTerms = [
      "corrente","correntes","colar","colares","pulseira","pulseiras","brinco","brincos","pingente","pingentes",
      "tornozeleira","tornozeleiras","piercing","piercings","escapulario","choker"
    ];

    if(hasAny(text, selling) || ((hasWord(text,["vender","avaliar"]) || hasAny(text,["para vender","para avaliacao"])) && hasAny(text,["ouro","prata","joia","joias","corrente","anel","alianca","pulseira","brinco","pingente","moeda"])) || (hasAny(text,["compram joia","compram joias"]) && !hasAny(text,["aco","tungstenio","titanio","cobre","bronze"]))) return "sell_gold_silver";

    if(hasAny(text, repairIntent)){
      if(hasAny(text, nonJewelryRepairTargets) || hasAny(text, unsupportedMetals)) return "unsupported_repair";
      if(hasAny(text, jewelryRepairTargets)) return "repair";
      return "repair_clarify";
    }

    if(hasAny(text, goldPriceAmbiguous)) return "gold_price_clarify";
    if(hasAny(text, unsupportedMetals)) return "unsupported_material";
    if(hasAny(text, personalization) && hasAny(text, purchaseTerms)) return "personalized_commercial";
    if(hasAny(text, personalization)) return "personalized";

    if(hasAny(text, ringTerms) && (hasAny(text, purchaseTerms) || hasAny(text, stockTerms) || hasAny(text,["modelos","modelo","disponibilidade","milimetros","milimetragem","gramatura","tamanho"]))) return "rings_order";
    if(hasAny(text, stockTerms) && hasAny(text, semijewelryTerms)) return "store_semijewelry";
    if(hasAny(text, stockTerms) && hasAny(text,["corrente de ouro","correntes de ouro","ouro 18k"])) return "store_gold_chains";
    if(hasAny(text, stockTerms)) return "store_stock";

    if(hasAny(text,["macica","macico","oca","oco"])) return "solid_or_hollow";
    if(hasAny(text,["largura","milimetros","3mm","4mm","5mm","6mm","alianca fina","alianca larga"])) return "width_style";
    if(hasAny(text,["diferenca entre ouro e prata","ouro ou prata","melhor ouro ou prata","qual material escolher"])) return "material_comparison";
    if(hasAny(text,["pagamento","pix","cartao","boleto","entrada","pagar na entrega","pagamento na entrega","formas de pagamento"])) return "payment";
    if(hasAny(text,["frete","entrega","enviam","envio","todo brasil","fora de curitiba"])) return "shipping";
    if(hasAny(text,["gravacao","gravar","nome dentro","data dentro","frase dentro"])) return "engraving";
    if(hasAny(text,["ouro 24k","24 quilates","ouro puro"])) return "gold24k";
    if(hasAny(text,["ouro 18k","ouro e 18k","ouro 18 k","18 quilates","750","teor do ouro","ouro verdadeiro"])) return "gold18k";
    if(hasAny(text,["prata 925","teor da prata","prata verdadeira","prata escurece","prata fica preta","oxidacao da prata"])) return "silver925";
    if(hasAny(text,["garantia da semijoia","garantia semijoia","garantia do banho","garantia folheado","garantia banhado"])) return "semijewelry_warranty";
    if(hasAny(text,["garantia cobre","garantia de quebra","garantia da pedra","garantia do conserto","garantia de risco","garantia de riscos"])) return "warranty_scope";
    if(hasAny(text,["garantia","certificado","nota fiscal","autenticidade","procedencia"])) return "trust_docs";
    if(hasAny(text,["prazo","quanto tempo","dias uteis","fica pronto","produzir","producao"])) return "production_time";
    if(hasAny(text,["numeracao","numero do aro","tamanho do aro","medir o dedo","medida do dedo","qual aro","meu aro","aro do anel"])) return "ring_size";
    if(hasAny(text,["anatomica","anatomico","semi anatomica","semianatomica","interno reto","confort fit","comfort fit"])) return "comfort";
    if(hasAny(text,["ouro escurece","ouro escureceu","ouro fica preto","ouro ficou preto","ouro oxidou","ouro perdeu o brilho"])) return "gold_care";
    if(hasAny(text,["limpar","limpeza","cuidar","cuidados","escureceu","ficou preta","oxidou","manutencao"])) return "care";
    if(hasAny(text,["diamante","pedra","zirconia","safira","ametista","esmeralda","rubi"])) return "stones";
    if(hasAny(text,["onde fica","onde ficam","onde voces ficam","endereco","loja fisica","curitiba","bairro alto","empresa confiavel","sao confiaveis","e confiavel","golpe","seguranca","avaliacoes google"])) return "location_trust";
    if(hasAny(text,["ouro 10k","10 quilates","ouro 14k","14 quilates"])) return "other_gold_karat";
    if(hasAny(text,["o que e semijoia","o que e uma semijoia","peca banhada","como funciona o banho","milesimos","verniz cataforetico"])) return "plated_explanation";

    if(hasAny(text, semijewelryTerms) && (hasAny(text, purchaseTerms) || hasAny(text, readyProductTerms))) return "store_semijewelry";
    if(hasAny(text,["corrente de ouro","correntes de ouro"]) && (hasAny(text, purchaseTerms) || hasAny(text,["modelos","estoque"]))) return "store_gold_chains";
    if(hasAny(text, readyProductTerms) && hasAny(text, purchaseTerms)) return "store_products";
    if(hasAny(text,["produtos","catalogo da loja","catalogo oficial","site","loja"]) && hasAny(text,["ver","abrir","conhecer","acessar","comprar"])) return "store_stock";

    if(hasAny(text, semijewelryTerms)) return "semijewelry";
    if(hasAny(text, ringTerms) && hasAny(text,["fazem","vendem","tem","trabalham com","quero","procuro"])) return "rings_order";
    if(hasAny(text,["joia","joias","pingente","corrente","pulseira"]) && hasAny(text, purchaseTerms)) return "commercial";
    if(hasAny(text, purchaseTerms)) return "commercial";
    if(hasWord(text,["oi","ola"]) || hasAny(text,["bom dia","boa tarde","boa noite","tudo bem"])) return "greeting";
    if(hasWord(text,["obrigado","obrigada","valeu","agradeco"])) return "thanks";
    return "unknown";
  }

  const RESPONSES = {
    greeting: { text:"Olá! Eu sou a <strong>Coroa 24K</strong>. Posso ajudar com alianças, ouro 18k, prata 925, produtos à pronta entrega, personalizados, consertos ou avaliação de peças.", quick:["Ver pronta entrega","Quero alianças","Peça personalizada","Quero vender ouro","Preciso de conserto"] },
    store_stock: { text:"Os <strong>preços e produtos à pronta entrega</strong> são mantidos atualizados na loja oficial. Lá você encontra semijoias, joias, correntes, pulseiras, brincos, pingentes, colares, piercings, utilidades e outras categorias disponíveis no momento.", store:"products", storeLabel:"Ver produtos e estoque atual" },
    store_products: { text:"Para correntes, colares, pulseiras, brincos, pingentes e outros produtos à pronta entrega, consulte a loja oficial. O valor e a disponibilidade exibidos nela são a referência atual.", store:"products", storeLabel:"Abrir loja oficial" },
    store_semijewelry: { text:"As semijoias disponíveis, com valores e estoque atualizados, estão na loja oficial. Há opções femininas, masculinas, linha fitness e linha personalizável.", store:"semijewelry", storeLabel:"Ver semijoias disponíveis" },
    store_gold_chains: { text:"As correntes de ouro 18k disponíveis e seus valores atuais estão listados na loja oficial. Como estoque, medidas e construção podem mudar, confirme diretamente na página do produto.", store:"goldChains", storeLabel:"Ver correntes de ouro 18k" },
    rings_order: { text:"Anéis, solitários e alianças são feitos <strong>por encomenda</strong>. Numeração, largura, milimetragem, gramatura, acabamento e detalhes do projeto mudam a peça. O site pode mostrar um valor de referência, mas os atendentes verificam promoções e calculam a condição correta para o seu pedido.", action:"sales", actionLabel:"Consultar valor e promoção" },
    personalized: { text:"Sim. A Emporium24k desenvolve peças personalizadas em <strong>ouro 18k ou prata 925</strong>, a partir de uma ideia, desenho ou foto de referência. O projeto passa por análise de viabilidade técnica antes do orçamento.", quick:["Quero orçamento do personalizado","Pode ser igual a uma foto?","Vocês fazem molde 3D?"] },
    personalized_commercial: { text:"Fazemos personalizados em ouro 18k ou prata 925. Para calcular corretamente, a equipe precisa analisar o tipo de peça, material, medidas, referência e prazo.", action:"sales", actionLabel:"Enviar projeto para orçamento" },
    shipping: { text:"Vendemos para <strong>todo o Brasil</strong> e o frete das alianças e pedidos atendidos pela equipe é gratuito. Para itens comprados diretamente na loja online, a condição vigente aparece no produto e no checkout.", quick:["Ver pronta entrega","Qual o prazo de produção?","Quero fazer um pedido"] },
    engraving: { text:"As <strong>gravações internas são gratuitas</strong> nas alianças compradas conosco. É possível gravar nomes, data ou uma frase curta, conforme o espaço disponível na peça.", quick:["Quero orçamento de alianças","Como saber a numeração?"] },
    gold18k: { text:"Trabalhamos com <strong>ouro 18k</strong>, que possui 75% de ouro puro e 25% de liga metálica para resistência. As joias acompanham nota fiscal, certificado e garantia permanente do teor.", quick:["Qual a diferença para ouro 24k?","Quero alianças em ouro 18k"] },
    gold24k: { text:"O ouro 24k é praticamente puro, mas é mais macio e deforma com maior facilidade. Por isso, para joias de uso diário, a Emporium24k trabalha com <strong>ouro 18k</strong>, que possui 75% de ouro puro e maior resistência. Nas semijoias, o termo ouro 24k pode se referir ao banho superficial, não ao interior maciço da peça.", quick:["O que é uma peça banhada?","Quero joia em ouro 18k"] },
    silver925: { text:"A prata 925 contém 92,5% de prata pura. Ela pode escurecer com o tempo por oxidação, o que é natural e não significa perda do teor. Trabalhamos com prata 925 e oferecemos garantia permanente do teor nas joias.", quick:["Como limpar prata?","Quero alianças de prata"] },
    plated_explanation: { text:"Semijoia é uma peça de metal-base revestida por camadas de ouro ou prata. A linha informada pela Emporium24k utiliza banho de ouro 24k ou prata 925, verniz cataforético e pedras de zircônia em diversos modelos. Ela não deve ser confundida com uma joia maciça de ouro 18k ou prata 925.", store:"platedInfo", storeLabel:"Ler explicação completa" },
    semijewelry_warranty: { text:"A linha de semijoias possui <strong>1 ano de garantia no folheamento</strong>, conforme as condições do certificado. Danos por queda, mau uso, produtos químicos, riscos, amassados, quebras, perda de pedras ou ajustes de terceiros não entram automaticamente na cobertura e precisam ser analisados.", store:"warranty", storeLabel:"Ver condições de garantia" },
    trust_docs: { text:"As joias em ouro 18k e prata 925 acompanham <strong>nota fiscal e certificado</strong>. A garantia permanente é sobre o teor do metal. A linha de semijoias tem garantia específica de 1 ano no folheamento, conforme as condições de uso.", quick:["Ver garantia completa","Onde vocês ficam?","Quero falar com vendedor"] },
    production_time: { text:"O prazo depende do produto. Anéis, alianças e personalizados são produzidos por encomenda e o prazo é confirmado pelo atendente conforme o projeto. Modelos listados no site podem exibir uma previsão própria de despacho, que deve ser conferida na página do produto.", quick:["Quero confirmar meu prazo","Ver pronta entrega"] },
    ring_size: { text:"A numeração correta evita ajustes e desconforto. A melhor opção é medir com uma aneleira ou confirmar em uma joalheria. Medidas por régua, barbante ou foto podem gerar erro; a equipe pode orientar o procedimento mais seguro.", quick:["Interno reto ou anatômico?","Quero ajuda com a numeração"] },
    comfort: { text:"O <strong>interno reto</strong> tem a parte interna plana. O <strong>semianatômico</strong> possui leve curvatura. O <strong>anatômico</strong> tem curvatura interna mais acentuada e costuma oferecer maior conforto, especialmente em alianças largas.", quick:["Quero orçamento de alianças","Como saber a numeração?"] },
    care: { text:"O cuidado depende do material. Evite cloro, produtos químicos, impactos e atrito excessivo. Prata e semijoias podem escurecer; limpeza ou polimento inadequado pode danificar o acabamento. Para avaliar uma <strong>joia ou semijoia</strong> com segurança, nossa equipe pode orientar.", quick:["Preciso consertar uma joia","Preciso consertar uma semijoia"] },
    stones: { text:"Trabalhamos com projetos com pedras, desde que o modelo seja tecnicamente viável. Tipo, tamanho, cravação e disponibilidade da pedra influenciam o orçamento, por isso a equipe precisa analisar a referência.", action:"sales", actionLabel:"Enviar referência para orçamento" },
    solid_or_hollow: { text:"O peso e a construção da peça — maciça ou oca — dependem do modelo escolhido. Essa informação deve aparecer claramente no orçamento e no pedido; a equipe comercial confirma o tipo exato antes da compra.", action:"sales", actionLabel:"Confirmar modelo e construção" },
    width_style: { text:"A largura muda o visual, o conforto, o peso e o valor da aliança. Modelos mais finos tendem a ser discretos; os mais largos têm presença maior. A melhor medida depende do estilo, numeração e orçamento do casal.", action:"sales", actionLabel:"Escolher largura com um especialista" },
    material_comparison: { text:"O ouro 18k é mais valioso, tem alta durabilidade e mantém valor de material. A prata 925 oferece um investimento inicial menor, mas pode oxidar e exige limpeza periódica. A escolha depende do orçamento e do uso esperado.", quick:["Quero alianças de ouro","Quero alianças de prata"] },
    payment: { text:"As condições de pagamento e promoções podem mudar. Para produtos à pronta entrega, consulte a condição atual na loja oficial. Para anéis, alianças e encomendas, fale com o atendimento, pois os vendedores podem ter promoções diferentes do valor de referência do site.", quick:["Ver pronta entrega","Quero valor de alianças"] },
    location_trust: { text:"A Emporium24k é uma empresa de Curitiba, com atendimento físico no <strong>Bairro Alto</strong> e vendas para todo o Brasil. Trabalhamos com nota fiscal, certificado, garantia do teor e rastreamento do envio.", quick:["Quero falar com vendedor","Abrir loja oficial"] },
    other_gold_karat: { text:"A Emporium24k trabalha exclusivamente com <strong>ouro 18k</strong> nas joias de ouro e prata 925 nas joias de prata. Não produzimos peças em ouro 10k ou 14k.", quick:["Quero alianças em ouro 18k","Qual o valor?"] },
    gold_care: { text:"O ouro 18k não costuma oxidar como a prata, mas a peça pode perder brilho ou aparentar escurecimento por resíduos, produtos químicos, suor ou alteração no acabamento. A causa deve ser avaliada antes de qualquer polimento.", quick:["Preciso consertar uma joia"] },
    warranty_scope: { text:"A garantia permanente da linha de joias é sobre o <strong>teor do ouro 18k ou da prata 925</strong>. Quebras, riscos, pedras, deformações e desgastes dependem da causa e precisam de análise técnica para definir reparo e custo.", quick:["Preciso consertar uma joia"] },
    semijewelry: { text:"Também trabalhamos com semijoias banhadas e realizamos consertos quando a peça permite reparo. Para ver modelos e estoque atual, acesse a loja oficial. Para conserto, a equipe técnica analisa primeiro a peça.", quick:["Ver semijoias disponíveis","Preciso consertar uma semijoia","Como funciona o banho?"] },
    repair_clarify: { text:"Consertamos somente <strong>joias e semijoias</strong>. Qual é a peça que precisa de reparo?", quick:["É uma joia","É uma semijoia"] },
    repair: { text:"Realizamos consertos somente de <strong>joias e semijoias</strong>, sujeitos à análise da peça, do material e da viabilidade do reparo. Envie uma foto e explique o problema para a equipe responsável.", action:"repair", actionLabel:"Enviar joia ou semijoia para análise" },
    unsupported_repair: { text:"Não realizamos esse tipo de conserto. A Emporium24k conserta somente <strong>joias e semijoias</strong>, após análise técnica. Não consertamos relógios, veículos, eletrônicos, utensílios, móveis ou outros objetos." },
    sell_gold_silver: { text:"Compramos e avaliamos itens de <strong>ouro e prata</strong>. O valor depende do teor, peso e análise da peça; por isso não é seguro fechar uma cotação apenas pelo chat. O atendimento de avaliação orienta os próximos passos.", action:"evaluation", actionLabel:"Avaliar ouro ou prata" },
    gold_price_clarify: { text:"Você quer saber o valor para <strong>comprar uma joia</strong> ou quer <strong>vender ouro para a Emporium24k</strong>?", quick:["Quero comprar joia de ouro","Quero vender meu ouro"] },
    unsupported_material: { text:"A Emporium24k confecciona e compra somente itens de <strong>ouro e prata</strong>. Não confeccionamos peças de moeda, aço, tungstênio, titânio, cobre, bronze ou outros metais, e também não compramos esses materiais. As semijoias vendidas na loja são peças banhadas, não projetos confeccionados nesses metais.", quick:["Pode fazer em ouro 18k?","Pode fazer em prata 925?"] },
    commercial: { text:"Para informar preço com precisão, a equipe precisa considerar o produto, material, medidas, peso, acabamento e disponibilidade. Se for um item de pronta entrega, o site oficial mostra preço e estoque atual. Se for anel, aliança ou personalizado, o atendimento calcula o pedido e verifica promoções.", quick:["Ver pronta entrega","Falar com especialista"] },
    thanks: { text:"Por nada! Quando precisar, é só me perguntar. Posso ajudar com pronta entrega, alianças, personalizados, consertos de joias e semijoias ou avaliação de ouro e prata.", quick:["Ver pronta entrega","Quero alianças","Falar com atendente"] },
    unknown: { text:"Ainda não encontrei uma resposta segura para essa pergunta. Para não passar informação incompleta, você pode reformular, consultar a loja oficial para preços e estoque ou falar diretamente com um especialista.", quick:["Ver pronta entrega","Alianças e anéis","Vender ouro ou prata","Conserto de joia ou semijoia","Falar com especialista"] }
  };

  const QUICK_ALIASES = Object.freeze({
    "Ver pronta entrega":"Quais produtos estão à pronta entrega?",
    "Abrir loja oficial":"Quero acessar a loja oficial",
    "Ver garantia completa":"Qual é a garantia das joias e semijoias?",
    "Quero confirmar meu prazo":"Quero confirmar o prazo do meu pedido com um atendente",
    "Quero ajuda com a numeração":"Quero falar com atendente sobre a numeração do anel",
    "Quero alianças de ouro":"Quero comprar alianças de ouro",
    "Quero alianças de prata":"Quero comprar alianças de prata",
    "Quero alianças em ouro 18k":"Quero comprar alianças em ouro 18k",
    "Quero joia em ouro 18k":"Quero comprar joia em ouro 18k",
    "Falar com especialista":"Quero falar com um especialista",
    "Falar com atendente":"Quero falar com um atendente",
    "Quero falar com vendedor":"Quero falar com vendedor",
    "Alianças e anéis":"Quero informações sobre alianças e anéis",
    "Conserto":"Preciso de conserto de uma joia ou semijoia",
    "Conserto de joia ou semijoia":"Preciso de conserto de uma joia ou semijoia",
    "É uma joia":"Preciso consertar uma joia",
    "É uma semijoia":"Preciso consertar uma semijoia",
    "Vender ouro ou prata":"Quero vender ouro ou prata",
    "Ver semijoias disponíveis":"Quais semijoias estão em estoque?",
    "Quero valor de alianças":"Quanto custam as alianças?"
  });

  function buildWhatsUrl(type, context){
    const phone = type === "sales" ? chooseSalesAgent() : CONFIG.evaluationAndRepairs;
    const introText = type === "sales" ? "Olá! Vim pelo assistente Coroa 24K e quero atendimento comercial." :
      type === "repair" ? "Olá! Vim pelo assistente Coroa 24K e preciso analisar o conserto de uma joia ou semijoia." :
      "Olá! Vim pelo assistente Coroa 24K e quero avaliar itens de ouro ou prata para venda.";
    const text = `${introText}\n\nMinha pergunta: ${context || "Quero mais informações."}`;
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
  }

  function addMessage(html, who="bot"){
    if(intro) intro.style.display = "none";
    const row = document.createElement("div");
    row.className = `row ${who === "user" ? "user" : ""}`;
    if(who !== "user"){
      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = "♛";
      row.appendChild(avatar);
    }
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = html;
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function addQuick(items){
    const box = document.createElement("div");
    box.className = "quick";
    items.forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => handleQuestion(QUICK_ALIASES[label] || label));
      box.appendChild(button);
    });
    messages.appendChild(box);
    messages.scrollTop = messages.scrollHeight;
  }

  function addAction(type, label, context){
    const card = document.createElement("div");
    card.className = "action-card";
    const note = document.createElement("p");
    note.textContent = type === "sales" ? "Você será direcionado a um dos atendentes comerciais." :
      type === "repair" ? "O reparo é exclusivo para joias e semijoias e depende da análise da peça." :
      "A avaliação depende de teste, teor e peso.";
    const link = document.createElement("a");
    link.className = "action-btn wa";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.href = buildWhatsUrl(type, context);
    link.textContent = `◉ ${label}`;
    link.addEventListener("click", () => track("whatsapp_click", {type, topic: state.lastTopic}));
    card.append(note, link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function addStoreAction(key, label){
    const url = CONFIG.store[key] || CONFIG.store.products;
    const card = document.createElement("div");
    card.className = "action-card store-card";
    const note = document.createElement("p");
    note.textContent = "A loja oficial é a fonte atual para valores, disponibilidade e condições dos itens à pronta entrega.";
    const link = document.createElement("a");
    link.className = "action-btn store";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.href = url;
    link.textContent = `↗ ${label}`;
    link.addEventListener("click", () => track("store_click", {key, topic: state.lastTopic}));
    card.append(note, link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping(){
    const row = addMessage('<span class="typing"><span></span><span></span><span></span></span>');
    return () => row.remove();
  }

  function saveUnknown(question){
    try{
      const key = "emporium24k_unknown_questions";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({question, at: new Date().toISOString()});
      localStorage.setItem(key, JSON.stringify(list.slice(-100)));
    }catch(_){}
  }

  function track(name, detail){
    try{
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({event: name, ...detail});
      window.dispatchEvent(new CustomEvent(`emporium:${name}`, {detail}));
    }catch(_){}
  }

  async function handleQuestion(raw){
    const question = String(raw || "").trim();
    if(!question || state.busy) return;
    state.busy = true;
    input.value = "";
    const safe = question.replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
    addMessage(safe, "user");
    const stop = showTyping();
    await new Promise((resolve) => setTimeout(resolve, 260));
    stop();
    const topic = classify(question);
    state.lastTopic = topic;
    const response = RESPONSES[topic] || RESPONSES.unknown;
    addMessage(response.text);
    if(topic === "unknown") saveUnknown(question);
    if(response.quick) addQuick(response.quick);
    if(response.action) addAction(response.action, response.actionLabel, question);
    if(response.store) addStoreAction(response.store, response.storeLabel);
    track("assistant_answer", {topic});
    state.busy = false;
    input.focus();
  }

  $("#composer").addEventListener("submit", (event) => {
    event.preventDefault();
    handleQuestion(input.value);
  });

  $("#topCta").addEventListener("click", () => handleQuestion("Quero falar com um especialista"));

  addMessage("Olá! Eu sou a <strong>Coroa 24K</strong>. Posso responder suas dúvidas, mostrar o estoque atualizado da loja oficial e encaminhar você para a equipe certa.");
  addQuick(["Ver pronta entrega","Quero alianças","Peça personalizada","Quero vender ouro","Preciso de conserto"]);

  window.__assistant = { normalize, classify, buildWhatsUrl, RESPONSES, CONFIG, QUICK_ALIASES };

  function runSelfTests(){
    const tests = [
      ["quanto custa um par de alianças?","rings_order"],
      ["as alianças estão em estoque?","rings_order"],
      ["quero ver modelos de anel","rings_order"],
      ["qual a gramatura do anel?","rings_order"],
      ["quais produtos estão a pronta entrega?","store_stock"],
      ["quero acessar a loja oficial","store_stock"],
      ["quais semijoias estão em estoque?","store_semijewelry"],
      ["tem corrente de ouro a pronta entrega?","store_gold_chains"],
      ["quanto custa uma pulseira?","store_products"],
      ["quero comprar um brinco","store_products"],
      ["quero vender uma corrente de ouro","sell_gold_silver"],
      ["quanto vocês pagam na grama da prata?","sell_gold_silver"],
      ["vocês compram ouro usado?","sell_gold_silver"],
      ["quanto está o ouro hoje?","gold_price_clarify"],
      ["qual a cotação do ouro?","gold_price_clarify"],
      ["vocês consertam joias?","repair"],
      ["concertam semijoias?","repair"],
      ["minha corrente quebrou","repair"],
      ["consertam aliança de ouro?","repair"],
      ["vocês fazem conserto?","repair_clarify"],
      ["consertam relógios?","unsupported_repair"],
      ["arrumam carros?","unsupported_repair"],
      ["reparam aviões?","unsupported_repair"],
      ["consertam panelas?","unsupported_repair"],
      ["consertam celulares?","unsupported_repair"],
      ["consertam aliança de tungstênio?","unsupported_repair"],
      ["fazem anel personalizado?","personalized"],
      ["quero orçamento de pingente personalizado","personalized_commercial"],
      ["fazem igual a uma foto?","personalized"],
      ["fazem aliança de moeda?","unsupported_material"],
      ["trabalham com tungstênio?","unsupported_material"],
      ["compram cobre?","unsupported_material"],
      ["o frete é grátis?","shipping"],
      ["enviam para todo brasil?","shipping"],
      ["a gravação é gratuita?","engraving"],
      ["o ouro é 18k?","gold18k"],
      ["qual a diferença do ouro 24k?","gold24k"],
      ["prata 925 escurece?","silver925"],
      ["o que é uma peça banhada?","plated_explanation"],
      ["qual a garantia da semijoia?","semijewelry_warranty"],
      ["tem certificado e nota fiscal?","trust_docs"],
      ["quanto tempo para ficar pronto?","production_time"],
      ["como descubro meu aro?","ring_size"],
      ["qual diferença do anatômico?","comfort"],
      ["como limpar minha aliança?","care"],
      ["trabalham com diamante?","stones"],
      ["aceitam pix?","payment"],
      ["onde fica a loja?","location_trust"],
      ["fazem ouro 10k?","other_gold_karat"],
      ["vocês trabalham com semijoias?","semijewelry"],
      ["oi bom dia","greeting"],
      ["obrigado pela ajuda","thanks"],
      ["qual a temperatura em marte?","unknown"]
    ];

    const failures = [];
    for(const [question, expected] of tests){
      const got = classify(question);
      if(got !== expected) failures.push({question, expected, got});
    }
    const missing = [...new Set(tests.map((item) => item[1]))].filter((key) => !RESPONSES[key]);
    const quickFailures = [];
    for(const response of Object.values(RESPONSES)){
      for(const label of response.quick || []){
        const question = QUICK_ALIASES[label] || label;
        const got = classify(question);
        if(got === "unknown" || got === "empty") quickFailures.push({label, question, got});
      }
    }
    const urls = {
      sales: buildWhatsUrl("sales", "teste"),
      evaluation: buildWhatsUrl("evaluation", "teste"),
      repair: buildWhatsUrl("repair", "teste")
    };
    const checks = {
      total: tests.length,
      passed: tests.length - failures.length,
      failures,
      missing,
      quickFailures,
      salesPhoneOk: CONFIG.sales.some((phone) => urls.sales.includes(phone)),
      evaluationPhoneOk: urls.evaluation.includes(CONFIG.evaluationAndRepairs),
      repairPhoneOk: urls.repair.includes(CONFIG.evaluationAndRepairs),
      storeUrlsHttps: Object.values(CONFIG.store).every((url) => url.startsWith("https://www.emporium24k.com.br/"))
    };
    const element = $("#test-results");
    element.style.display = "block";
    element.textContent = JSON.stringify(checks, null, 2);
    document.title = failures.length || missing.length || quickFailures.length ? "TEST_FAIL" : "TEST_OK";
  }

  if(new URLSearchParams(location.search).has("test")) runSelfTests();
})();
