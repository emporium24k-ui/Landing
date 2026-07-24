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

  const state = {
    salesAgent: null,
    lastTopic: null,
    lastVariant: Object.create(null),
    history: [],
    busy: false
  };

  const $ = (selector) => document.querySelector(selector);
  const messages = $("#messages");
  const intro = $("#intro");
  const input = $("#question");

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hasAny = (text, terms) => terms.some((term) => text.includes(term));
  const hasWord = (text, words) => words.some((word) => new RegExp(`(^|\\s)${word}(\\s|$)`).test(text));

  const repairIntent = [
    "conserto","concerto","concertar","consertar","consertam","concertam","arrumar","arrumam",
    "reparar","reparam","reparo","soldar","solda","quebrou","quebrada","quebrado","apertar pedra",
    "pedra caiu","polimento","polir","banho de novo","novo banho","restaurar","ajustar aro",
    "ajuste de aro","aumentar aro","diminuir aro","reformar joia"
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

  const sellingTerms = [
    "quero vender","vender ouro","vender prata","vendo ouro","vendo prata","avaliar meu ouro","avaliar minha prata",
    "avaliacao de ouro","avaliacao de prata","quanto voces pagam","quanto pagam","compram ouro","compram prata",
    "compra de ouro","compra de prata","tenho ouro usado","tenho prata usada","ouro usado","prata usada",
    "sucata de ouro","sucata de prata","joia usada","joias usadas","corrente usada","anel usado","alianca usada",
    "peca usada","teste de teor","testar ouro","testar prata"
  ];

  const personalizationTerms = [
    "personalizado","personalizada","personalizar","sob medida","do zero","igual a foto","igual a uma foto",
    "igual uma foto","foto de referencia","desenho proprio","molde 3d","com iniciais","com nome","projeto exclusivo"
  ];

  const ringTerms = ["alianca","aliancas","anel","aneis","solitario","solitarios"];
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
  const purchaseTerms = [
    "quanto custa","qual valor","qual o valor","preco","orcamento","quanto fica","parcelamento","parcela","parcelam",
    "desconto","promocao","comprar","quero uma","quero um","encomendar","fazer pedido","fazer um pedido","como pedir",
    "catalogo","modelos disponiveis","tem disponivel","valor da alianca","valor das aliancas","valor do anel","quero alianca",
    "quero aliancas","quero joia","quero joias","quero anel","ver aliancas","ver joias","falar com especialista",
    "falar com atendente","falar com vendedor","quero falar com um especialista","quero falar com um atendente",
    "vendem ouro","vendem prata","vendem alianca","vendem aliancas","vendem joia","vendem joias","tem alianca",
    "tem aliancas","tem joia","tem joias","quantas gramas","quanto pesa","peso da alianca","peso das aliancas","peso do anel"
  ];

  function chooseSalesAgent(){
    if(state.salesAgent) return state.salesAgent;
    try{
      const data = new Uint32Array(1);
      crypto.getRandomValues(data);
      state.salesAgent = CONFIG.sales[data[0] % CONFIG.sales.length];
    }catch(_){
      state.salesAgent = CONFIG.sales[Math.random() < 0.5 ? 0 : 1];
    }
    return state.salesAgent;
  }

  function classify(raw){
    const text = normalize(raw);
    if(!text) return "empty";

    if(state.lastTopic === "repair_clarify"){
      if(hasAny(text, nonJewelryRepairTargets) || hasAny(text, unsupportedMetals)) return "unsupported_repair";
      if(hasAny(text, jewelryRepairTargets)) return "repair";
    }
    if(state.lastTopic === "gold_price_clarify"){
      if(hasAny(text, sellingTerms) || hasAny(text,["vender","avaliar","meu ouro","minha prata"])) return "sell_gold_silver";
      if(hasAny(text,["comprar","joia","alianca","anel","corrente"])) return "commercial";
    }
    if(state.lastTopic === "personalized" && hasAny(text,[...jewelryRepairTargets,"ouro 18k","prata 925","ouro","prata"])){
      return "personalized_commercial";
    }

    if(hasAny(text, sellingTerms) || ((hasWord(text,["vender","avaliar"]) || hasAny(text,["para vender","para avaliacao"])) && hasAny(text,["ouro","prata","joia","joias","corrente","anel","alianca","pulseira","brinco","pingente","moeda"]))) return "sell_gold_silver";

    if(hasAny(text, repairIntent)){
      if(hasAny(text, nonJewelryRepairTargets) || hasAny(text, unsupportedMetals)) return "unsupported_repair";
      if(hasAny(text, jewelryRepairTargets)) return "repair";
      return "repair_clarify";
    }

    if(hasAny(text,["boleto","boletado","parcelar no boleto","boleto parcelado"])) return "boleto_special";
    if(hasAny(text,["rastreio","rastrear pedido","onde esta meu pedido","acompanhar pedido","codigo de rastreio","meu pedido nao chegou"])) return "order_tracking";
    if(hasAny(text,["desconto","promocao","melhor valor","valor promocional","condicao especial"])) return "discount";
    if(hasAny(text,["preco no site","valor no site","valor do site","site esta mais caro","site esta mais barato","preco do site","valor de referencia"])) return "site_price_vs_service";
    if(hasAny(text,["preco do ouro","valor do ouro","quanto esta o ouro","cotacao do ouro","grama do ouro"])) return "gold_price_clarify";
    if(hasAny(text, unsupportedMetals)) return "unsupported_material";
    if(hasAny(text, personalizationTerms) && hasAny(text, purchaseTerms)) return "personalized_commercial";
    if(hasAny(text, personalizationTerms)) return "personalized";

    if(hasAny(text, ringTerms) && (hasAny(text, purchaseTerms) || hasAny(text, stockTerms) || hasAny(text,["modelos","modelo","disponibilidade","milimetros","milimetragem","gramatura","tamanho"]))) return "rings_order";
    if(hasAny(text, stockTerms) && hasAny(text, semijewelryTerms)) return "store_semijewelry";
    if(hasAny(text, stockTerms) && hasAny(text,["corrente de ouro","correntes de ouro","ouro 18k"])) return "store_gold_chains";
    if(hasAny(text, stockTerms)) return "store_stock";

    if(hasAny(text,["macica","macico","oca","oco"])) return "solid_or_hollow";
    if(hasAny(text,["largura","milimetros","3mm","4mm","5mm","6mm","alianca fina","alianca larga"])) return "width_style";
    if(hasAny(text,["diferenca entre ouro e prata","ouro ou prata","melhor ouro ou prata","qual material escolher"])) return "material_comparison";
    if(hasAny(text,["pagamento","pix","cartao","entrada","pagar na entrega","pagamento na entrega","formas de pagamento"])) return "payment";
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
    if(hasWord(text,["oi","ola","eai"]) || hasAny(text,["bom dia","boa tarde","boa noite","tudo bem"])) return "greeting";
    if(hasWord(text,["obrigado","obrigada","valeu","agradeco"])) return "thanks";
    return "unknown";
  }

  const RESPONSES = Object.freeze({
    greeting: {
      variants: [
        "Olá! Eu sou a <strong>Coroa 24K</strong>. Pode me perguntar do seu jeito; eu tento resolver por aqui e, quando precisar, encaminho você para a pessoa certa.",
        "Oi! Sou a Coroa 24K. Posso ajudar com alianças, joias, personalizados, estoque, consertos de joias e semijoias ou avaliação de ouro e prata.",
        "Olá, tudo bem? Pode escrever normalmente. Eu conheço os principais assuntos da Emporium24k e não vou inventar uma resposta quando algo precisar de confirmação humana."
      ]
    },
    store_stock: {
      variants: [
        "Os produtos à pronta entrega, com preço e disponibilidade atualizados, ficam na <strong>loja oficial</strong>. O estoque pode mudar, então o site é a referência mais segura.",
        "Para pronta entrega, vale consultar diretamente a loja oficial. Ela mostra o que está disponível agora e o valor vigente de cada item.",
        "Temos vários itens à pronta entrega, mas eu prefiro não copiar uma lista que pode ficar desatualizada. A loja oficial mostra estoque e preços em tempo real."
      ],
      store: "products", storeLabel: "Ver estoque atualizado"
    },
    store_products: {
      variants: [
        "Correntes, colares, pulseiras, brincos, pingentes e outros itens prontos ficam listados na loja oficial, com preço e disponibilidade atuais.",
        "Esse tipo de produto costuma aparecer na loja online quando está disponível. Você consegue conferir o valor e comprar diretamente por lá.",
        "Para produtos à pronta entrega, o caminho mais rápido é a loja oficial: ali você vê as opções que realmente estão em estoque agora."
      ],
      store: "products", storeLabel: "Abrir loja oficial"
    },
    store_semijewelry: {
      variants: [
        "As semijoias disponíveis estão na loja oficial, com estoque e valores atualizados. Lá você encontra opções femininas, masculinas e outras linhas.",
        "Para semijoias, o site é a melhor referência porque mostra exatamente o que está à pronta entrega naquele momento.",
        "Temos semijoias, sim. Como os modelos entram e saem de estoque, deixo o link da categoria atualizada para você conferir sem risco de informação antiga."
      ],
      store: "semijewelry", storeLabel: "Ver semijoias disponíveis"
    },
    store_gold_chains: {
      variants: [
        "As correntes de ouro 18k disponíveis e seus valores atuais estão na loja oficial. Medida, construção e estoque aparecem na página do produto.",
        "Para correntes de ouro 18k à pronta entrega, consulte a categoria atualizada no site. Assim você vê somente o que está disponível agora.",
        "Temos uma área específica para correntes de ouro 18k. O site mostra preço e disponibilidade atuais, sem depender de uma lista fixa no assistente."
      ],
      store: "goldChains", storeLabel: "Ver correntes de ouro 18k"
    },
    rings_order: {
      variants: [
        "Anéis, solitários e alianças são feitos <strong>por encomenda</strong>. Numeração, largura, milimetragem, gramatura e acabamento alteram a peça. Mesmo quando há valor de referência no site, o atendimento verifica promoções e calcula a condição correta.",
        "Nesse caso eu não mandaria você fechar direto pelo site. Anéis e alianças são produzidos conforme medida e configuração, e os vendedores podem ter condições melhores que o valor de referência online.",
        "Para anéis, solitários e alianças, o valor depende da configuração final. O site ajuda como referência, mas o orçamento e as promoções devem ser confirmados com o atendimento.",
        "Essas peças não trabalham como um estoque comum: são produzidas no tamanho, largura e gramatura escolhidos. Vou direcionar para o atendimento calcular corretamente."
      ],
      action: "sales", actionLabel: "Consultar valor e promoção"
    },
    personalized: {
      variants: [
        "Sim, fazemos peças personalizadas em <strong>ouro 18k ou prata 925</strong>. Pode partir de uma ideia, desenho ou foto de referência, desde que o projeto seja tecnicamente viável. Que tipo de peça você imaginou?",
        "Conseguimos desenvolver personalizados em ouro 18k e prata 925. A equipe analisa formato, medidas, material e referência antes de confirmar o projeto. Qual peça você quer criar?",
        "Fazemos, sim. Você pode mandar uma foto, um desenho ou explicar a ideia. Depois avaliamos a viabilidade e montamos o orçamento em ouro 18k ou prata 925."
      ]
    },
    personalized_commercial: {
      variants: [
        "Perfeito. Para orçar o personalizado, a equipe precisa ver a referência e confirmar material, medidas, detalhes e prazo.",
        "Nesse ponto vale falar com o atendimento: eles recebem a foto ou desenho, verificam a viabilidade e calculam o projeto.",
        "Consigo te encaminhar agora. O orçamento do personalizado depende da análise do modelo, do material e das dimensões finais."
      ],
      action: "sales", actionLabel: "Enviar projeto para orçamento"
    },
    shipping: {
      variants: [
        "Vendemos para <strong>todo o Brasil</strong>. Para alianças e pedidos fechados com a equipe, o frete é gratuito. Nas compras diretas da loja online, vale a condição exibida no produto e no checkout.",
        "Enviamos para todo o Brasil. Em pedidos atendidos pela equipe, como alianças, o frete é grátis; já no site, a regra vigente aparece antes do pagamento.",
        "Sim, fazemos envios nacionais. O frete de alianças e encomendas tratadas com o atendimento é gratuito. Para pronta entrega, confirme a condição no checkout da loja."
      ]
    },
    engraving: {
      variants: [
        "A gravação interna é <strong>gratuita nas alianças compradas conosco</strong>. Pode ser nome, data ou uma frase curta, respeitando o espaço da peça.",
        "Nas alianças da Emporium24k, a gravação interna já está incluída. O conteúdo precisa caber com boa leitura dentro da largura escolhida.",
        "Sim, gravamos gratuitamente as alianças compradas conosco. Nomes e datas são os pedidos mais comuns, mas uma frase curta também pode funcionar."
      ]
    },
    gold18k: {
      variants: [
        "O ouro 18k possui <strong>75% de ouro puro</strong> e 25% de liga metálica para dar resistência. As joias acompanham nota fiscal, certificado e garantia permanente do teor.",
        "Trabalhamos com ouro 18k, também identificado como ouro 750. Ele combina alto teor de ouro com resistência adequada para uso diário.",
        "Sim, nas joias de ouro trabalhamos com 18k. A peça vai com certificado, nota fiscal e garantia permanente do teor do metal."
      ]
    },
    gold24k: {
      variants: [
        "O ouro 24k é praticamente puro, mas é muito mais macio. Para joias de uso diário, trabalhamos com <strong>ouro 18k</strong>. Em semijoias, 'banho de ouro 24k' fala do revestimento, não do interior maciço.",
        "24k tem teor maior, porém deforma com mais facilidade. Por isso a joalheria costuma usar ouro 18k nas peças; já nas semijoias, o 24k pode aparecer como banho superficial.",
        "Nas nossas joias de ouro, o padrão é 18k. Ouro 24k é mais puro, mas menos resistente para uma peça de uso frequente."
      ]
    },
    silver925: {
      variants: [
        "A prata 925 possui <strong>92,5% de prata pura</strong>. Ela pode escurecer por oxidação, e isso não significa que perdeu o teor. Nas joias, oferecemos garantia permanente do teor.",
        "Prata 925 é prata de lei. O escurecimento com o tempo é natural e costuma ser resolvido com limpeza adequada.",
        "Trabalhamos com prata 925 nas joias de prata. Ela pode oxidar, mas continua sendo prata 925; o cuidado correto recupera o brilho."
      ]
    },
    plated_explanation: {
      variants: [
        "Semijoia é uma peça de metal-base revestida por camadas de ouro ou prata. Ela não é o mesmo que uma joia maciça de ouro 18k ou prata 925.",
        "Uma peça banhada recebe um revestimento externo de ouro ou prata sobre outro metal. A durabilidade depende do banho, do verniz e principalmente dos cuidados de uso.",
        "Nas semijoias, o metal precioso fica no revestimento. Nas joias, o próprio corpo da peça é ouro 18k ou prata 925. Essa é a diferença principal."
      ],
      store: "platedInfo", storeLabel: "Ler explicação completa"
    },
    semijewelry_warranty: {
      variants: [
        "As semijoias têm <strong>1 ano de garantia no folheamento</strong>, conforme as condições do certificado. Queda, mau uso, químicos, riscos, quebras e perda de pedras precisam de análise e não entram automaticamente.",
        "A garantia da semijoia cobre o folheamento por 1 ano, respeitando as condições de uso. Danos físicos ou contato inadequado com produtos químicos são avaliados separadamente.",
        "Para semijoias, a garantia é de 1 ano no banho. O certificado explica o que está coberto e quais situações dependem de análise."
      ],
      store: "warranty", storeLabel: "Ver condições de garantia"
    },
    trust_docs: {
      variants: [
        "As joias em ouro 18k e prata 925 acompanham <strong>nota fiscal e certificado</strong>. A garantia permanente é sobre o teor do metal.",
        "Você recebe nota fiscal e certificado nas joias. A Emporium24k garante permanentemente o teor do ouro 18k ou da prata 925.",
        "Sim, trabalhamos com documentação: nota fiscal, certificado e garantia do teor para as joias em ouro 18k e prata 925."
      ]
    },
    production_time: {
      variants: [
        "O prazo depende da peça. Anéis, alianças e personalizados são feitos por encomenda, então o atendente confirma o prazo conforme o projeto. Produtos do site podem ter uma previsão própria de despacho.",
        "Para peças sob encomenda, o prazo só fica correto depois de definir modelo, medidas e material. Na pronta entrega, a previsão aparece na página do produto.",
        "O tempo de produção varia com a complexidade. O atendimento confirma antes do fechamento para evitar prometer uma data que não seja realista."
      ]
    },
    ring_size: {
      variants: [
        "A forma mais segura é medir com uma aneleira ou confirmar em uma joalheria. Régua, barbante e foto podem gerar erro, principalmente em alianças largas.",
        "Para acertar o aro, recomendo uma medição profissional. A largura e o formato interno também podem mudar a sensação no dedo.",
        "A numeração precisa estar correta antes da produção. Se você ainda não souber, o atendimento orienta a forma mais segura de medir."
      ]
    },
    comfort: {
      variants: [
        "O interno reto é plano. O semianatômico tem uma curvatura leve. O anatômico possui uma curvatura interna maior e costuma ser mais confortável, sobretudo em alianças largas.",
        "A diferença está na curvatura interna: quanto mais anatômica, mais arredondada fica a região de contato com o dedo.",
        "Em alianças finas a diferença pode ser discreta; nas largas, o interno anatômico costuma melhorar bastante o conforto."
      ]
    },
    care: {
      variants: [
        "Evite cloro, produtos químicos, impactos e atrito excessivo. O cuidado muda conforme o material; se a peça já escureceu ou perdeu brilho, é melhor avaliar antes de polir em casa.",
        "Para conservar a peça, retire antes de piscina, limpeza pesada e contato com químicos. Prata e semijoias podem escurecer, mas cada caso pede um cuidado diferente.",
        "Limpeza agressiva pode piorar o acabamento. Se for uma joia ou semijoia da qual você não conhece o tratamento, mande uma foto para avaliarmos antes."
      ]
    },
    stones: {
      variants: [
        "Trabalhamos com projetos com pedras, desde que a cravação e o modelo sejam tecnicamente viáveis. Tipo, tamanho e disponibilidade da pedra influenciam o orçamento.",
        "Dá para usar pedras em muitos projetos. A equipe precisa analisar a referência para definir tamanho, cravação e resistência da peça.",
        "Sim, fazemos peças com pedras. Como cada pedra e cravação muda o projeto, o orçamento precisa ser analisado pelo atendimento."
      ],
      action: "sales", actionLabel: "Enviar referência para orçamento"
    },
    solid_or_hollow: {
      variants: [
        "A peça pode ser maciça ou oca dependendo do modelo. Isso muda peso, resistência e valor, por isso precisa ficar claro no orçamento.",
        "Construção maciça e oca não são a mesma coisa. A equipe confirma o tipo exato antes da compra para você saber o que está recebendo.",
        "O peso sozinho não explica tudo; é importante confirmar se o modelo é maciço ou oco e qual será o peso final estimado."
      ],
      action: "sales", actionLabel: "Confirmar construção da peça"
    },
    width_style: {
      variants: [
        "A largura muda bastante o visual, o conforto, o peso e o preço. Modelos finos são mais discretos; os largos têm mais presença.",
        "Não existe uma largura melhor para todo mundo. Ela precisa combinar com o estilo do casal, o tamanho do dedo e a faixa de investimento.",
        "Milímetros fazem diferença real em uma aliança. O atendimento pode mostrar proporções e calcular o efeito no peso e no valor."
      ],
      action: "sales", actionLabel: "Escolher largura com especialista"
    },
    material_comparison: {
      variants: [
        "O ouro 18k tem maior valor de material e alta durabilidade. A prata 925 exige investimento inicial menor, mas pode oxidar e pede limpeza periódica.",
        "Se a prioridade é tradição e valor de material, ouro 18k costuma ser a escolha. Se a prioridade é reduzir o investimento, prata 925 pode fazer mais sentido.",
        "Os dois materiais são legítimos, mas têm propostas diferentes. Ouro 18k custa mais; prata 925 é mais acessível e demanda mais manutenção estética."
      ]
    },
    payment: {
      variants: [
        "As formas e condições de pagamento podem variar conforme o produto e a campanha. Para pronta entrega, o site mostra a condição atual; para encomendas, o atendente confirma as opções.",
        "No site você vê as condições dos itens à pronta entrega. Em anéis, alianças e personalizados, vale consultar o atendimento porque podem existir promoções específicas.",
        "O pagamento depende do tipo de pedido. Para eu não te passar uma condição antiga, o atendimento confirma as opções vigentes no momento."
      ],
      action: "sales", actionLabel: "Consultar formas de pagamento"
    },
    boleto_special: {
      variants: [
        "Temos uma possibilidade por boleto feita em conjunto com o banco, mas preciso ser transparente: <strong>o valor final da peça aumenta bastante</strong>. Normalmente só compensa para quem está com o nome realmente restrito e não consegue usar outra forma de pagamento. A equipe precisa simular.",
        "Existe boleto, porém não funciona como um parcelamento comum da loja. É uma operação com o banco e o custo sobe consideravelmente. Em geral, faz sentido apenas quando a pessoa está negativada e sem alternativa de pagamento.",
        "Dá para avaliar o boleto bancário, sim, mas ele encarece muito o pedido. Eu não recomendaria para quem consegue pagar de outra forma; o uso mais racional é para quem está com restrição no nome e precisa de uma alternativa."
      ],
      action: "sales", actionLabel: "Solicitar simulação no boleto"
    },
    discount: {
      variants: [
        "As promoções mudam e podem ser diferentes do valor de referência do site, especialmente em anéis e alianças. O atendimento verifica a melhor condição disponível.",
        "Para desconto real, o ideal é falar com o vendedor. Eles conseguem conferir a campanha atual e calcular o pedido na configuração correta.",
        "Pode existir uma condição promocional, mas eu não vou prometer um percentual sem consultar. O atendimento confirma o melhor valor vigente."
      ],
      action: "sales", actionLabel: "Consultar promoção atual"
    },
    site_price_vs_service: {
      variants: [
        "O valor do site serve como referência. Em anéis, alianças e peças por encomenda, a configuração final muda o orçamento e os atendentes podem ter promoções específicas.",
        "Para pronta entrega, o preço válido é o do site. Já para anéis e alianças, o site mostra uma base, mas o atendimento confirma medidas, peso e condição promocional.",
        "A diferença acontece porque produtos prontos e peças sob encomenda seguem lógicas diferentes. O atendente calcula a peça real e verifica a campanha vigente."
      ],
      action: "sales", actionLabel: "Confirmar valor correto"
    },
    order_tracking: {
      variants: [
        "Para localizar um pedido ou confirmar o rastreio, a equipe precisa dos dados da compra. Vou te encaminhar para o atendimento.",
        "Consigo te direcionar, mas o rastreamento exige identificar o pedido. Tenha em mãos o nome usado na compra ou o número do pedido.",
        "O status do pedido não fica disponível dentro deste assistente. O atendimento consegue consultar usando os dados da compra."
      ],
      action: "sales", actionLabel: "Consultar meu pedido"
    },
    location_trust: {
      variants: [
        "A Emporium24k é de Curitiba, com atendimento físico no <strong>Bairro Alto</strong>, e vende para todo o Brasil. Trabalhamos com nota fiscal, certificado e rastreamento.",
        "Temos operação física em Curitiba, no Bairro Alto, além do atendimento online nacional. As joias acompanham documentação e garantia do teor.",
        "Sim, a empresa possui atendimento físico em Curitiba e envia para todo o Brasil. Nota fiscal, certificado e rastreamento fazem parte da segurança da compra."
      ]
    },
    other_gold_karat: {
      variants: [
        "Nas joias de ouro trabalhamos exclusivamente com <strong>ouro 18k</strong>. Não produzimos em ouro 10k ou 14k.",
        "O padrão da Emporium24k para joias de ouro é 18k. Se o projeto for em prata, usamos prata 925.",
        "Não fazemos peças em ouro 10k ou 14k. Nossa produção de joias utiliza ouro 18k e prata 925."
      ]
    },
    gold_care: {
      variants: [
        "O ouro 18k pode perder brilho ou aparentar escurecimento por resíduos, químicos, suor ou alteração no acabamento. Antes de polir, vale identificar a causa.",
        "O ouro 18k não costuma oxidar como a prata, mas pode ficar opaco ou acumular resíduos. Uma avaliação evita usar um produto inadequado.",
        "Se a joia de ouro mudou de aparência, mande uma foto. Dependendo do caso, pode ser apenas limpeza, polimento ou contato com algum produto."
      ]
    },
    warranty_scope: {
      variants: [
        "A garantia permanente das joias é sobre o <strong>teor do ouro 18k ou da prata 925</strong>. Quebras, riscos, pedras, deformações e desgaste precisam de análise técnica.",
        "O teor do metal tem garantia permanente. Danos físicos não são automaticamente a mesma coisa e dependem da causa e da avaliação da peça.",
        "Garantia do teor significa que o metal pode ser testado futuramente. Reparos por quebra, risco ou pedra solta são analisados separadamente."
      ]
    },
    semijewelry: {
      variants: [
        "Também trabalhamos com semijoias banhadas. Para ver modelos e estoque, consulte a loja oficial. Se for conserto, a peça precisa passar por análise.",
        "Temos semijoias, sim. Os modelos disponíveis ficam no site, e reparos só são confirmados depois de avaliar a viabilidade da peça.",
        "A linha de semijoias está na loja oficial. Como o estoque muda, o site é a melhor referência para modelos e valores atuais."
      ],
      store: "semijewelry", storeLabel: "Ver semijoias"
    },
    repair_clarify: {
      variants: [
        "Consertamos somente <strong>joias e semijoias</strong>. Qual é a peça que precisa de reparo?",
        "Posso verificar, mas antes preciso saber o objeto: é uma joia ou uma semijoia?",
        "Nosso setor de consertos atende apenas joias e semijoias. Me diga qual peça quebrou ou precisa de ajuste."
      ]
    },
    repair: {
      variants: [
        "Realizamos consertos de <strong>joias e semijoias</strong>, sujeitos à análise do material e da viabilidade. Uma foto e uma explicação do problema ajudam bastante.",
        "Dá para analisar, sim. O conserto só é confirmado depois que a equipe vê a peça e entende o dano.",
        "Consertamos joias e semijoias, mas não prometemos o reparo sem avaliar. Envie uma foto para a equipe técnica verificar."
      ],
      action: "repair", actionLabel: "Enviar peça para análise"
    },
    unsupported_repair: {
      variants: [
        "Não realizamos esse tipo de conserto. Nosso setor atende somente <strong>joias e semijoias</strong>.",
        "Esse item fica fora do nosso serviço. Consertamos apenas joias e semijoias, depois de análise técnica.",
        "Nesse caso não conseguimos ajudar com o reparo. A Emporium24k não conserta relógios, veículos, eletrônicos, utensílios ou outros objetos."
      ]
    },
    sell_gold_silver: {
      variants: [
        "Compramos e avaliamos itens de <strong>ouro e prata</strong>. O valor depende do teor, peso e teste da peça, então a cotação final precisa ser feita pelo setor responsável.",
        "Sim, avaliamos ouro e prata para compra. Para não criar uma expectativa errada, o valor só é confirmado após pesar e testar o material.",
        "Você pode enviar os itens para avaliação. Trabalhamos apenas com ouro e prata; a equipe verifica teor, peso e condição antes de informar o valor."
      ],
      action: "evaluation", actionLabel: "Avaliar ouro ou prata"
    },
    gold_price_clarify: {
      variants: [
        "Só para eu te encaminhar certo: você quer saber o valor para <strong>comprar uma joia</strong> ou quer <strong>vender ouro</strong> para a Emporium24k?",
        "Você está procurando o preço de uma peça nova ou quer avaliar ouro usado para venda? São atendimentos diferentes.",
        "Quando você fala em valor do ouro, é para comprar uma joia ou para vender um item de ouro que já possui?"
      ]
    },
    unsupported_material: {
      variants: [
        "A Emporium24k confecciona e compra somente itens de <strong>ouro e prata</strong>. Não fazemos projetos em moeda, aço, tungstênio, titânio, cobre ou outros metais.",
        "Esse material não faz parte da nossa produção nem da compra de metais. Trabalhamos com ouro 18k e prata 925.",
        "Não trabalhamos com esse metal. Para projetos novos, as opções são ouro 18k ou prata 925; para compra de usados, avaliamos apenas ouro e prata."
      ]
    },
    commercial: {
      variants: [
        "Consigo te orientar, mas para informar o valor correto a equipe precisa considerar produto, material, medidas, peso, acabamento e disponibilidade.",
        "Nesse ponto vale falar com o atendimento. Se for pronta entrega, o site mostra preço e estoque; se for encomenda, o vendedor calcula e verifica promoções.",
        "Vou te encaminhar para quem consegue fechar essa informação com precisão e conferir a melhor condição disponível."
      ],
      action: "sales", actionLabel: "Falar com especialista"
    },
    thanks: {
      variants: [
        "Por nada! Pode continuar perguntando por aqui.",
        "Imagina. Quando precisar, é só escrever.",
        "Disponha! Se surgir outra dúvida sobre joias, alianças ou atendimento, pode mandar."
      ]
    },
    unknown: {
      variants: [
        "Não encontrei uma resposta segura para isso. Pode explicar de outra forma? Prefiro perguntar de novo do que inventar uma informação.",
        "Acho que ainda não entendi exatamente o que você precisa. Tente escrever com um pouco mais de contexto.",
        "Não quero te responder no chute. Reformule a pergunta ou diga se o assunto é compra, conserto, personalizado, estoque ou venda de ouro e prata."
      ]
    }
  });

  function pickVariant(topic){
    const entry = RESPONSES[topic] || RESPONSES.unknown;
    const variants = entry.variants || [entry.text || ""];
    if(variants.length === 1) return variants[0];
    let index;
    do { index = Math.floor(Math.random() * variants.length); }
    while(index === state.lastVariant[topic] && variants.length > 1);
    state.lastVariant[topic] = index;
    return variants[index];
  }

  function buildWhatsUrl(type, context){
    const phone = type === "sales" ? chooseSalesAgent() : CONFIG.evaluationAndRepairs;
    const introText = type === "sales"
      ? "Olá! Vim pelo assistente Coroa 24K e quero atendimento comercial."
      : type === "repair"
        ? "Olá! Vim pelo assistente Coroa 24K e preciso analisar o conserto de uma joia ou semijoia."
        : "Olá! Vim pelo assistente Coroa 24K e quero avaliar itens de ouro ou prata para venda.";
    const text = `${introText}\n\nMinha pergunta: ${context || "Quero mais informações."}`;
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
  }

  function clock(){
    return new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function addMessage(html, who = "bot"){
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
    return row;
  }

  function addAction(type, label, context){
    const card = document.createElement("div");
    card.className = "action-card";
    const note = document.createElement("p");
    note.textContent = type === "sales"
      ? "O WhatsApp abre com sua dúvida já preenchida."
      : type === "repair"
        ? "O conserto é exclusivo para joias e semijoias e depende da análise da peça."
        : "A avaliação depende de teste, teor e peso.";
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
    note.textContent = "A loja oficial é a referência atual para preço, estoque e condições dos produtos à pronta entrega.";
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
    row.classList.add("typing-row");
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

  function typingDelay(question){
    const base = 300 + Math.min(question.length * 7, 650);
    return Math.min(1050, base + Math.floor(Math.random() * 160));
  }

  async function handleQuestion(raw){
    const question = String(raw || "").trim();
    if(!question || state.busy) return;

    state.busy = true;
    input.value = "";
    const safe = question.replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
    addMessage(safe, "user");
    state.history.push({role:"user", text:question});

    const stop = showTyping();
    await new Promise((resolve) => setTimeout(resolve, typingDelay(question)));
    stop();

    const topic = classify(question);
    state.lastTopic = topic;
    const response = RESPONSES[topic] || RESPONSES.unknown;
    const text = pickVariant(topic);
    addMessage(text);
    state.history.push({role:"assistant", topic, text});

    if(topic === "unknown") saveUnknown(question);
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

  const hour = new Date().getHours();
  const opening = hour < 12
    ? "Bom dia! Eu sou a <strong>Coroa 24K</strong>. Pode perguntar do seu jeito — vou tentar resolver por aqui."
    : hour < 18
      ? "Boa tarde! Eu sou a <strong>Coroa 24K</strong>. Pode escrever normalmente; eu te ajudo e encaminho quando for necessário."
      : "Boa noite! Eu sou a <strong>Coroa 24K</strong>. Pode mandar sua dúvida do jeito que você falaria com uma pessoa.";
  addMessage(opening);

  window.__assistant = { normalize, classify, buildWhatsUrl, RESPONSES, CONFIG };

  function runSelfTests(){
    const previousTopic = state.lastTopic;
    state.lastTopic = null;
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
      ["quanto voces pagam na grama da prata?","sell_gold_silver"],
      ["voces compram ouro usado?","sell_gold_silver"],
      ["quanto esta o ouro hoje?","gold_price_clarify"],
      ["qual a cotacao do ouro?","gold_price_clarify"],
      ["voces consertam joias?","repair"],
      ["concertam semijoias?","repair"],
      ["minha corrente quebrou","repair"],
      ["consertam alianca de ouro?","repair"],
      ["voces fazem conserto?","repair_clarify"],
      ["consertam relogios?","unsupported_repair"],
      ["arrumam carros?","unsupported_repair"],
      ["reparam avioes?","unsupported_repair"],
      ["consertam panelas?","unsupported_repair"],
      ["consertam celulares?","unsupported_repair"],
      ["consertam alianca de tungstenio?","unsupported_repair"],
      ["fazem anel personalizado?","personalized"],
      ["quero orcamento de pingente personalizado","personalized_commercial"],
      ["fazem igual a uma foto?","personalized"],
      ["fazem alianca de moeda?","unsupported_material"],
      ["trabalham com tungstenio?","unsupported_material"],
      ["compram cobre?","unsupported_material"],
      ["o frete e gratis?","shipping"],
      ["enviam para todo brasil?","shipping"],
      ["a gravacao e gratuita?","engraving"],
      ["o ouro e 18k?","gold18k"],
      ["qual a diferenca do ouro 24k?","gold24k"],
      ["prata 925 escurece?","silver925"],
      ["o que e uma peca banhada?","plated_explanation"],
      ["qual a garantia da semijoia?","semijewelry_warranty"],
      ["tem certificado e nota fiscal?","trust_docs"],
      ["quanto tempo para ficar pronto?","production_time"],
      ["como descubro meu aro?","ring_size"],
      ["qual diferenca do anatomico?","comfort"],
      ["como limpar minha alianca?","care"],
      ["trabalham com diamante?","stones"],
      ["aceitam pix?","payment"],
      ["fazem por boleto?","boleto_special"],
      ["tem boleto parcelado?","boleto_special"],
      ["consegue desconto?","discount"],
      ["o valor do site e o mesmo?","site_price_vs_service"],
      ["onde esta meu pedido?","order_tracking"],
      ["onde fica a loja?","location_trust"],
      ["fazem ouro 10k?","other_gold_karat"],
      ["voces trabalham com semijoias?","semijewelry"],
      ["oi bom dia","greeting"],
      ["obrigado pela ajuda","thanks"],
      ["qual a temperatura em marte?","unknown"]
    ];

    const failures = [];
    for(const [question, expected] of tests){
      state.lastTopic = null;
      const got = classify(question);
      if(got !== expected) failures.push({question, expected, got});
    }

    state.lastTopic = "repair_clarify";
    const followUpRepair = classify("uma corrente de prata");
    state.lastTopic = "gold_price_clarify";
    const followUpGoldSell = classify("quero vender uma corrente");
    state.lastTopic = previousTopic;

    const missing = [...new Set(tests.map((item) => item[1]))].filter((key) => !RESPONSES[key]);
    const insufficientVariants = Object.entries(RESPONSES)
      .filter(([,value]) => !Array.isArray(value.variants) || value.variants.length < 3)
      .map(([key]) => key);
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
      insufficientVariants,
      followUpRepair,
      followUpGoldSell,
      salesPhoneOk: CONFIG.sales.some((phone) => urls.sales.includes(phone)),
      evaluationPhoneOk: urls.evaluation.includes(CONFIG.evaluationAndRepairs),
      repairPhoneOk: urls.repair.includes(CONFIG.evaluationAndRepairs),
      storeUrlsHttps: Object.values(CONFIG.store).every((url) => url.startsWith("https://www.emporium24k.com.br/"))
    };
    const element = $("#test-results");
    element.style.display = "block";
    element.textContent = JSON.stringify(checks, null, 2);
    document.title = failures.length || missing.length || insufficientVariants.length || followUpRepair !== "repair" || followUpGoldSell !== "sell_gold_silver" ? "TEST_FAIL" : "TEST_OK";
  }

  if(new URLSearchParams(location.search).has("test")) runSelfTests();
})();
