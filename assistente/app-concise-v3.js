(() => {
  "use strict";

  const CONFIG = Object.freeze({
    sales: ["5541995888995", "5541995776736"],
    service: "5541998518452",
    store: {
      products: "https://www.emporium24k.com.br/produtos/",
      semijewelry: "https://www.emporium24k.com.br/semijoias/",
      goldChains: "https://www.emporium24k.com.br/joias/masculino1/ouro-18k1/correntes/",
      warranty: "https://www.emporium24k.com.br/garantia-emporium24k/",
      platedInfo: "https://www.emporium24k.com.br/o-que-e-uma-peca-banhada/"
    }
  });

  const state = {
    salesAgent: null,
    context: null,
    lastTopic: null,
    lastVariant: Object.create(null),
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

  const tokens = (text) => text.split(" ").filter(Boolean);
  const hasPhrase = (text, phrases) => phrases.some((phrase) => text.includes(phrase));
  const hasExactWord = (text, words) => {
    const set = new Set(tokens(text));
    return words.some((word) => set.has(word));
  };
  const hasExactPhrase = (text, phrases) => phrases.some((phrase) => text === phrase);

  function levenshtein(a, b){
    if(a === b) return 0;
    if(!a.length) return b.length;
    if(!b.length) return a.length;
    const previous = Array.from({length:b.length + 1}, (_, index) => index);
    const current = new Array(b.length + 1);
    for(let i = 1; i <= a.length; i += 1){
      current[0] = i;
      for(let j = 1; j <= b.length; j += 1){
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      for(let j = 0; j <= b.length; j += 1) previous[j] = current[j];
    }
    return previous[b.length];
  }

  function fuzzyWord(text, targets){
    return tokens(text).some((token) => targets.some((target) => {
      if(token === target) return true;
      if(token.length < 5 || target.length < 5) return false;
      return Math.abs(token.length - target.length) <= 1 && levenshtein(token, target) <= 1;
    }));
  }

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

  const ringWords = ["alianca","aliancas","aliansa","aliansas","alinca","alincas","anel","aneis","solitario","solitarios","aparador","aparadores"];
  const ringOccasions = ["casamento","casar","casando","noivado","noivar","noiva","noivo","compromisso","namoro","bodas","pedido de casamento","pedido de noivado"];
  const desireWords = ["quero","queria","gostaria","procuro","procurando","busco","preciso","desejo","interesse","interessado","interessada","pretendo","pensando"];
  const readyProducts = ["corrente","correntes","colar","colares","pulseira","pulseiras","brinco","brincos","pingente","pingentes","tornozeleira","tornozeleiras","piercing","piercings","escapulario","escapularios"];
  const semijewelryWords = ["semijoia","semijoias","semi joia","semi joias","banhada","banhado","folheada","folheado"];
  const repairWords = ["conserto","concerto","consertar","concertar","arrumar","reparar","reparo","soldar","solda","quebrou","quebrada","quebrado","polir","polimento","restaurar","ajustar aro","aumentar aro","diminuir aro","pedra caiu"];
  const jewelryWords = ["joia","joias","semijoia","semijoias","alianca","aliancas","anel","aneis","solitario","corrente","colar","pulseira","brinco","pingente","tornozeleira","piercing","escapulario","ouro","prata","pedra","zirconia","diamante"];
  const nonJewelry = ["relogio","relogios","smartwatch","carro","carros","moto","motos","aviao","avioes","panela","panelas","celular","celulares","computador","notebook","televisao","tv","bicicleta","sapato","bolsa","roupa","geladeira","fogao","microondas","oculos","movel","moveis"];
  const unsupportedMetals = ["aco","tungstenio","titanio","latao","cobre","bronze","moeda","bijuteria"];
  const personalizationWords = ["personalizado","personalizada","personalizar","sob medida","do zero","igual a foto","igual uma foto","foto de referencia","desenho proprio","molde 3d","com iniciais","com nome","projeto exclusivo"];
  const priceWords = ["quanto custa","qual valor","qual o valor","preco","orcamento","quanto fica","valor","desconto","promocao","parcelamento","parcela","parcelam"];
  const stockWords = ["estoque","em estoque","pronta entrega","pronto entrega","disponivel agora","disponiveis agora","entrega imediata","comprar pronto","ver produtos","loja oficial","site da loja","catalogo online"];
  const genericOtherProduct = ["outra peca","outra joia","outro produto","outra opcao","outro modelo","mais uma peca","quero ver outra","tem outra"];

  const clientSellingStrong = [
    "quero vender","queria vender","gostaria de vender","preciso vender","vou vender","vendo ouro","vendo prata",
    "avaliar meu ouro","avaliar minha prata","avaliar minhas joias","avaliar minhas pecas","quanto pagam",
    "quanto voces pagam","voces compram ouro","voces compram prata","compram ouro","compram prata",
    "ouro usado","prata usada","joia usada","joias usadas","sucata de ouro","sucata de prata",
    "tenho ouro para vender","tenho prata para vender","tenho joias para vender","tenho uma joia para vender",
    "tenho uma corrente para vender","minhas joias","meus ouros","minha prata"
  ];

  const storeSellingPhrases = [
    "tem joias para vender","tem joia para vender","tem joias pra vender","tem joia pra vender",
    "voces tem joias para vender","voces tem joias pra vender","voces vendem joias","vendem joias",
    "tem joias a venda","joias a venda","tem corrente para vender","tem pulseira para vender",
    "tem brinco para vender","tem pingente para vender","o que voces vendem","quais joias voces vendem"
  ];

  function hasRing(text){
    return hasPhrase(text, ringWords) || fuzzyWord(text, ["alianca","aliancas","solitario","aparador"]);
  }

  function hasJewelry(text){
    return hasPhrase(text, jewelryWords) || fuzzyWord(text, ["alianca","corrente","pulseira","brinco","pingente","semijoia"]);
  }

  function isStandaloneReadyProduct(text){
    const parts = tokens(text);
    if(parts.length > 3) return false;
    return hasExactWord(text, readyProducts) || hasExactPhrase(text, readyProducts);
  }

  function looksLikeStoreOffering(text){
    if(hasPhrase(text, storeSellingPhrases)) return true;
    const startsWithAvailability = /^(tem|tem alguma|tem algum|voces tem|vcs tem|vende|vendem|voces vendem|vcs vendem)\b/.test(text);
    const mentionsProduct = hasJewelry(text) || hasPhrase(text, readyProducts) || hasPhrase(text, semijewelryWords);
    const firstPersonPossession = hasExactWord(text, ["tenho","minha","meu","minhas","meus","possuo"]);
    return startsWithAvailability && mentionsProduct && !firstPersonPossession;
  }

  function looksLikeClientSelling(text){
    if(hasPhrase(text, clientSellingStrong)) return true;
    const sellVerb = hasExactWord(text, ["vender","avaliar","vendo"]);
    const product = hasJewelry(text) || hasExactWord(text, ["ouro","prata"]);
    const firstPerson = hasExactWord(text, ["quero","queria","gostaria","preciso","tenho","minha","meu","minhas","meus","possuo"]);
    return sellVerb && product && firstPerson;
  }

  function isSellingAmbiguous(text){
    const product = hasJewelry(text) || hasExactWord(text, ["ouro","prata"]);
    const sellLanguage = hasPhrase(text, ["para vender","pra vender"]) || hasExactWord(text, ["vender"]);
    return product && sellLanguage && !looksLikeStoreOffering(text) && !looksLikeClientSelling(text);
  }

  function isGreeting(text){
    return hasExactWord(text, ["oi","ola","eai"]) || hasPhrase(text, ["bom dia","boa tarde","boa noite","tudo bem"]);
  }

  function classify(raw){
    const text = normalize(raw);
    if(!text) return "empty";

    if(state.context === "sale_direction"){
      if(hasPhrase(text, ["quero comprar","ver joias","loja","voces vendem"]) || hasExactWord(text, ["comprar"])) return "store_products";
      if(hasPhrase(text, ["vender minhas","vender meu","vender minha","tenho para vender","quero vender"]) || hasExactWord(text, ["avaliar"])) return "sell_gold_silver";
    }

    if(state.context === "repair"){
      if(hasPhrase(text, nonJewelry) || hasPhrase(text, unsupportedMetals)) return "unsupported_repair";
      if(hasJewelry(text)) return "repair";
    }

    if(state.context === "gold_price"){
      if(looksLikeClientSelling(text) || hasExactWord(text, ["vender","avaliar"]) || hasPhrase(text, ["meu ouro","minha prata"])) return "sell_gold_silver";
      if(hasExactWord(text, ["comprar"]) || hasPhrase(text, ["joia","alianca","anel","corrente"])) return "commercial";
    }

    if(state.context === "personalized" && (hasJewelry(text) || hasExactWord(text, ["ouro","prata","foto","desenho"]))) return "personalized_commercial";

    if(state.context === "commercial"){
      if(hasPhrase(text, genericOtherProduct)) return "commercial_clarify";
      if(hasRing(text) || hasPhrase(text, ringOccasions)) return "rings_order";
      if(hasPhrase(text, semijewelryWords)) return "store_semijewelry";
      if(isStandaloneReadyProduct(text) || hasPhrase(text, readyProducts)) return "store_products";
      if(hasPhrase(text, personalizationWords)) return "personalized_commercial";
    }

    if(hasPhrase(text, genericOtherProduct)) return "commercial_clarify";

    if(looksLikeStoreOffering(text)){
      if(hasRing(text)) return "rings_order";
      if(hasPhrase(text, semijewelryWords)) return "store_semijewelry";
      if(hasPhrase(text, ["corrente de ouro","correntes de ouro"])) return "store_gold_chains";
      return "store_products";
    }

    if(looksLikeClientSelling(text)) return "sell_gold_silver";
    if(isSellingAmbiguous(text)) return "sale_direction_clarify";

    if(hasPhrase(text, repairWords) || fuzzyWord(text, ["conserto","consertar","reparar"])){
      if(hasPhrase(text, nonJewelry) || hasPhrase(text, unsupportedMetals)) return "unsupported_repair";
      if(hasJewelry(text)) return "repair";
      return "repair_clarify";
    }

    if(hasPhrase(text, ["boleto","boleto parcelado","parcelar no boleto","boletado"])) return "boleto_special";
    if(hasPhrase(text, ["rastreio","rastrear pedido","onde esta meu pedido","acompanhar pedido","codigo de rastreio","pedido nao chegou"])) return "order_tracking";
    if(hasPhrase(text, ["preco no site","valor no site","valor do site","preco do site","valor de referencia","site mais caro","site mais barato"])) return "site_price_vs_service";
    if(hasPhrase(text, ["desconto","promocao","melhor valor","condicao especial"])) return "discount";
    if(hasPhrase(text, ["preco do ouro","valor do ouro","quanto esta o ouro","cotacao do ouro","grama do ouro"])) return "gold_price_clarify";
    if(hasPhrase(text, unsupportedMetals)) return "unsupported_material";
    if(hasPhrase(text, personalizationWords) && (hasPhrase(text, priceWords) || hasPhrase(text, desireWords))) return "personalized_commercial";
    if(hasPhrase(text, personalizationWords)) return "personalized";

    const ringIntent = hasRing(text) && (
      hasPhrase(text, desireWords) || hasPhrase(text, priceWords) || hasPhrase(text, stockWords) ||
      hasPhrase(text, ringOccasions) || hasPhrase(text, ["modelo","modelos","ouro","prata","largura","tamanho","gramatura","milimetragem"])
    );
    if(ringIntent || (hasPhrase(text, ringOccasions) && hasPhrase(text, desireWords))) return "rings_order";

    if(hasPhrase(text, stockWords) && hasPhrase(text, semijewelryWords)) return "store_semijewelry";
    if(hasPhrase(text, stockWords) && hasPhrase(text, ["corrente de ouro","correntes de ouro","ouro 18k"])) return "store_gold_chains";
    if(hasPhrase(text, stockWords)) return "store_stock";
    if(hasPhrase(text, semijewelryWords) && (hasPhrase(text, desireWords) || hasPhrase(text, priceWords) || hasPhrase(text, readyProducts))) return "store_semijewelry";
    if(isStandaloneReadyProduct(text)) return "store_products";
    if(hasPhrase(text, readyProducts) && (hasPhrase(text, desireWords) || hasPhrase(text, priceWords) || hasExactWord(text, ["comprar","tem","vende","vendem"]))) return "store_products";

    if(hasPhrase(text, ["macica","macico","oca","oco"])) return "solid_or_hollow";
    if(hasPhrase(text, ["largura","milimetros","3mm","4mm","5mm","6mm","alianca fina","alianca larga"])) return "width_style";
    if(hasPhrase(text, ["ouro ou prata","melhor ouro ou prata","diferenca entre ouro e prata"])) return "material_comparison";
    if(hasPhrase(text, ["pagamento","pix","cartao","entrada","pagar na entrega","formas de pagamento"])) return "payment";
    if(hasPhrase(text, ["frete","entrega","enviam","envio","todo brasil","fora de curitiba"])) return "shipping";
    if(hasPhrase(text, ["gravacao","gravar","nome dentro","data dentro","frase dentro"])) return "engraving";
    if(hasPhrase(text, ["ouro 24k","24 quilates","ouro puro"])) return "gold24k";
    if(hasPhrase(text, ["ouro 18k","ouro 18 k","18 quilates","ouro 750","teor do ouro"])) return "gold18k";
    if(hasPhrase(text, ["prata 925","teor da prata","prata escurece","prata fica preta","oxidacao da prata"])) return "silver925";
    if(hasPhrase(text, ["garantia da semijoia","garantia semijoia","garantia do banho","garantia folheado"])) return "semijewelry_warranty";
    if(hasPhrase(text, ["garantia de quebra","garantia da pedra","garantia do conserto","garantia de risco"])) return "warranty_scope";
    if(hasPhrase(text, ["garantia","certificado","nota fiscal","autenticidade","procedencia"])) return "trust_docs";
    if(hasPhrase(text, ["prazo","quanto tempo","dias uteis","fica pronto","producao"])) return "production_time";
    if(hasPhrase(text, ["numeracao","numero do aro","tamanho do aro","medir o dedo","medida do dedo","qual aro"])) return "ring_size";
    if(hasPhrase(text, ["anatomica","anatomico","semianatomica","interno reto","confort fit","comfort fit"])) return "comfort";
    if(hasPhrase(text, ["ouro escurece","ouro escureceu","ouro ficou preto","ouro perdeu o brilho"])) return "gold_care";
    if(hasPhrase(text, ["limpar","limpeza","cuidados","escureceu","oxidou","manutencao"])) return "care";
    if(hasPhrase(text, ["diamante","pedra","zirconia","safira","ametista","esmeralda","rubi"])) return "stones";
    if(hasPhrase(text, ["onde fica","endereco","loja fisica","curitiba","bairro alto","empresa confiavel","golpe","avaliacoes google"])) return "location_trust";
    if(hasPhrase(text, ["ouro 10k","10 quilates","ouro 14k","14 quilates"])) return "other_gold_karat";
    if(hasPhrase(text, ["o que e semijoia","peca banhada","como funciona o banho","verniz cataforetico"])) return "plated_explanation";

    if(hasPhrase(text, semijewelryWords)) return "semijewelry";
    if(hasRing(text)) return "rings_order";
    if(hasExactWord(text, ["joia","joias","peca","pecas"]) && hasPhrase(text, desireWords)) return "commercial_clarify";
    if(isGreeting(text)) return "greeting";
    if(hasExactWord(text, ["obrigado","obrigada","valeu","agradeco"])) return "thanks";
    return "unknown";
  }

  const R = Object.freeze({
    greeting: ["Oi! Como posso ajudar?","Olá! O que você procura?","Oi, tudo bem? Qual é a sua dúvida?"],
    rings_order: ["Nossos anéis e alianças são feitos sob medida. O atendimento mostra modelos, valores e promoções.","Essas peças são feitas por encomenda, conforme tamanho e modelo. Vou te encaminhar.","Temos, sim. O vendedor confirma a configuração e a melhor condição."],
    personalized: ["Fazemos personalizados em ouro 18k e prata 925. Qual peça você quer criar?","Pode ser por foto, desenho ou ideia. Que peça você imaginou?","Conseguimos fazer sob medida. Me diga qual peça você quer."],
    personalized_commercial: ["Envie a referência para a equipe montar o orçamento.","O atendimento analisa a ideia e calcula o projeto.","Vou te encaminhar para enviar a foto ou desenho."],
    store_stock: ["Os itens à pronta entrega ficam atualizados na loja oficial.","O estoque e os valores atuais estão no nosso site.","Você pode ver o que está disponível agora na loja oficial."],
    store_products: ["Temos, sim. Os modelos e valores atuais estão na loja oficial.","Você pode conferir as peças disponíveis no site.","Vou abrir a loja para você ver as opções."],
    store_semijewelry: ["As semijoias disponíveis estão atualizadas no site.","Você pode conferir modelos, preços e estoque na loja oficial.","Vou abrir a categoria de semijoias para você."],
    store_gold_chains: ["As correntes de ouro 18k disponíveis estão no site.","Você pode conferir medidas, preços e estoque na loja oficial.","Vou abrir as correntes de ouro 18k para você."],
    shipping: ["Enviamos para todo o Brasil. Nos pedidos de alianças com a equipe, o frete é grátis.","Sim, vendemos para todo o Brasil.","Fazemos envios nacionais com rastreamento."],
    engraving: ["A gravação interna é gratuita nas alianças compradas conosco.","Nomes, datas ou frases curtas podem ser gravados sem custo.","A gravação já está incluída nas nossas alianças."],
    gold18k: ["Trabalhamos com ouro 18k, também chamado de ouro 750.","O ouro 18k tem 75% de ouro puro.","Nossas joias de ouro são 18k e acompanham certificado e nota fiscal."],
    gold24k: ["O ouro 24k é mais puro, mas muito mais macio. Para joias, usamos ouro 18k.","Nas joias usamos ouro 18k. O 24k aparece em algumas semijoias como banho.","O ouro 18k é mais indicado para joias de uso diário."],
    silver925: ["Trabalhamos com prata 925. Ela pode escurecer com o tempo, o que é natural.","A prata 925 pode oxidar sem perder o teor.","Nossas joias de prata são 925 e têm garantia do teor."],
    plated_explanation: ["Semijoia é uma peça revestida por ouro ou prata.","A semijoia recebe um banho externo de ouro ou prata sobre outro metal.","Na joia, o metal precioso forma a peça; na semijoia, ele fica no revestimento."],
    semijewelry_warranty: ["As semijoias têm 1 ano de garantia no folheamento.","A garantia da semijoia cobre o banho por 1 ano, dentro das condições de uso.","O folheamento tem 1 ano de garantia. Danos físicos precisam de análise."],
    trust_docs: ["As joias acompanham nota fiscal, certificado e garantia do teor.","Você recebe nota fiscal e certificado da peça.","Temos garantia permanente do teor nas joias."],
    production_time: ["O prazo depende da peça. O atendente confirma antes do fechamento.","Anéis e alianças são feitos por encomenda.","A equipe confirma o prazo depois de definir a peça."],
    ring_size: ["A forma mais segura é medir com uma aneleira ou em uma joalheria.","Régua e barbante podem dar erro. O ideal é usar uma aneleira.","A equipe pode orientar você a descobrir o aro."],
    comfort: ["O reto é plano por dentro. O semianatômico tem leve curvatura e o anatômico é mais arredondado.","O anatômico costuma ser mais confortável em alianças largas.","A diferença está na curvatura interna da aliança."],
    care: ["Evite cloro, químicos e impactos. A limpeza depende do material.","Prata e semijoias podem escurecer. Uma limpeza correta costuma resolver.","Antes de polir, confirme o material da peça."],
    stones: ["Fazemos peças com pedras, conforme a viabilidade do projeto.","Tipo, tamanho e cravação da pedra entram no orçamento.","Pode enviar uma referência para a equipe analisar."],
    solid_or_hollow: ["A peça pode ser maciça ou oca, dependendo do modelo.","Essa informação muda peso e valor.","O tipo de construção depende do modelo escolhido."],
    width_style: ["A largura muda o visual, o peso e o valor da aliança.","Modelos finos são discretos; os largos têm mais presença.","O atendente pode ajudar a escolher a largura."],
    material_comparison: ["O ouro 18k tem maior valor. A prata 925 é mais acessível e exige mais limpeza.","Os dois são bons; a escolha depende do orçamento e do uso.","O ouro custa mais. A prata tem menor investimento inicial."],
    payment: ["As condições variam conforme o pedido. O atendimento confirma as opções atuais.","Para encomendas, o vendedor verifica a melhor forma de pagamento.","Vou te encaminhar para consultar as condições."],
    boleto_special: ["Temos boleto pelo banco, mas o valor aumenta bastante. Só costuma compensar para quem está negativado e sem outra opção.","Existe boleto, porém ele encarece muito a peça.","Dá para simular boleto, mas não é a opção mais econômica."],
    discount: ["As promoções mudam. O vendedor verifica a melhor condição.","Pode haver um valor melhor que o site para anéis e alianças.","Vou te encaminhar para consultar a promoção atual."],
    site_price_vs_service: ["Para pronta entrega, vale o preço do site. Anéis e alianças podem ter promoções.","O site mostra uma referência. A peça sob medida é calculada pelo vendedor.","Anéis e alianças podem ter condições diferentes do valor online."],
    order_tracking: ["A equipe consulta usando os dados do pedido.","Vou te encaminhar para verificar o rastreio.","Tenha em mãos o nome ou número do pedido."],
    location_trust: ["Somos de Curitiba, no Bairro Alto, e enviamos para todo o Brasil.","Temos atendimento físico em Curitiba e vendas online para todo o país.","A Emporium24k fica em Curitiba e trabalha com nota fiscal e certificado."],
    other_gold_karat: ["Nas joias de ouro, trabalhamos somente com ouro 18k.","Não produzimos em ouro 10k ou 14k.","Para joias, usamos ouro 18k ou prata 925."],
    gold_care: ["O ouro 18k pode perder brilho por resíduos ou produtos químicos.","Às vezes é apenas acúmulo de resíduos. A equipe pode analisar.","Evite produtos caseiros fortes. Uma avaliação é mais segura."],
    warranty_scope: ["A garantia permanente é sobre o teor do ouro ou da prata.","Quebras, riscos e pedras são avaliados conforme a causa.","A cobertura depende do tipo de problema."],
    semijewelry: ["Temos semijoias, sim. Os modelos disponíveis ficam no site.","Trabalhamos com semijoias e também avaliamos consertos.","As opções disponíveis estão na loja oficial."],
    repair_clarify: ["Qual peça precisa de conserto?","É uma joia ou semijoia?","Me diga qual é a peça."],
    repair: ["Consertamos joias e semijoias, após análise.","Envie uma foto para a equipe avaliar o reparo.","Fazemos esse conserto quando é tecnicamente possível."],
    unsupported_repair: ["Não fazemos esse tipo de conserto. Trabalhamos apenas com joias e semijoias.","Nosso serviço de reparo é exclusivo para joias e semijoias.","Esse item não entra nos nossos serviços."],
    sell_gold_silver: ["Compramos ouro e prata. O valor depende do teor, peso e avaliação.","A equipe avalia a peça e informa o valor.","Você pode enviar os detalhes para o setor de avaliação."],
    sale_direction_clarify: ["Você quer comprar uma joia ou vender uma peça sua?","É para ver joias da loja ou avaliar uma peça sua?","Você procura uma joia ou quer vender a sua?"],
    gold_price_clarify: ["Você quer comprar uma joia ou vender ouro para nós?","É sobre compra de joia ou avaliação para venda?","Você quer saber o valor de uma peça ou vender ouro?"],
    unsupported_material: ["Trabalhamos somente com ouro e prata.","Não confeccionamos nem compramos esse material.","Nossa produção é apenas em ouro 18k e prata 925."],
    commercial_clarify: ["Qual peça você procura?","Você quer ver anel, corrente, colar, pulseira ou outra peça?","Me diga qual peça você tem em mente."],
    commercial: ["Vou te encaminhar para o atendimento comercial.","O vendedor confirma modelos, valores e condições.","A equipe ajuda você a escolher a melhor opção."],
    thanks: ["Por nada!","Imagina!","Estou por aqui."],
    unknown: ["Não entendi bem. Qual peça ou serviço você procura?","Pode explicar de outra forma?","Me conta um pouco mais."],
    empty: ["Pode escrever sua dúvida."]
  });

  const META = Object.freeze({
    rings_order: {action:"sales", label:"Ver modelos e valores"},
    personalized_commercial: {action:"sales", label:"Enviar referência"},
    payment: {action:"sales", label:"Consultar pagamento"},
    boleto_special: {action:"sales", label:"Simular boleto"},
    discount: {action:"sales", label:"Consultar promoção"},
    site_price_vs_service: {action:"sales", label:"Confirmar valor"},
    order_tracking: {action:"sales", label:"Consultar pedido"},
    commercial: {action:"sales", label:"Falar com atendimento"},
    repair: {action:"repair", label:"Enviar foto da peça"},
    sell_gold_silver: {action:"evaluation", label:"Avaliar ouro ou prata"},
    store_stock: {store:"products", label:"Abrir loja oficial"},
    store_products: {store:"products", label:"Ver produtos"},
    store_semijewelry: {store:"semijewelry", label:"Ver semijoias"},
    store_gold_chains: {store:"goldChains", label:"Ver correntes de ouro"},
    plated_explanation: {store:"platedInfo", label:"Ver explicação completa"},
    semijewelry_warranty: {store:"warranty", label:"Ver garantia"}
  });

  function updateContext(topic){
    const next = {
      sale_direction_clarify: "sale_direction",
      repair_clarify: "repair",
      gold_price_clarify: "gold_price",
      personalized: "personalized",
      commercial_clarify: "commercial"
    }[topic];
    if(next){
      state.context = next;
      return;
    }
    if(!["unknown","greeting","thanks","empty"].includes(topic)) state.context = null;
  }

  function pick(topic){
    const list = R[topic] || R.unknown;
    if(list.length === 1) return list[0];
    let index;
    do { index = Math.floor(Math.random() * list.length); }
    while(index === state.lastVariant[topic]);
    state.lastVariant[topic] = index;
    return list[index];
  }

  function whatsappUrl(type, context){
    const phone = type === "sales" ? chooseSalesAgent() : CONFIG.service;
    const lead = type === "repair"
      ? "Olá! Preciso avaliar o conserto de uma joia ou semijoia."
      : type === "evaluation"
        ? "Olá! Quero avaliar itens de ouro ou prata para venda."
        : "Olá! Vim pelo assistente Coroa 24K e quero atendimento.";
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(`${lead}\n\nMinha dúvida: ${context}`)}&type=phone_number&app_absent=0`;
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
    card.className = "action-card compact-card";
    const link = document.createElement("a");
    link.className = "action-btn wa";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.href = whatsappUrl(type, context);
    link.textContent = label;
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function addStore(key, label){
    const card = document.createElement("div");
    card.className = "action-card store-card compact-card";
    const link = document.createElement("a");
    link.className = "action-btn store";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.href = CONFIG.store[key] || CONFIG.store.products;
    link.textContent = label;
    card.appendChild(link);
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping(){
    const row = addMessage('<span class="typing"><span></span><span></span><span></span></span>');
    row.classList.add("typing-row");
    return () => row.remove();
  }

  async function handle(raw){
    const question = String(raw || "").trim();
    if(!question || state.busy) return;
    state.busy = true;
    input.value = "";
    const safe = question.replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
    addMessage(safe, "user");

    const stop = showTyping();
    const delay = Math.min(720, 240 + question.length * 4 + Math.floor(Math.random() * 100));
    await new Promise((resolve) => setTimeout(resolve, delay));
    stop();

    const topic = classify(question);
    state.lastTopic = topic;
    updateContext(topic);
    addMessage(pick(topic));

    const meta = META[topic];
    if(meta?.action) addAction(meta.action, meta.label, question);
    if(meta?.store) addStore(meta.store, meta.label);

    state.busy = false;
    input.focus();
  }

  $("#composer").addEventListener("submit", (event) => {
    event.preventDefault();
    handle(input.value);
  });
  $("#topCta").addEventListener("click", () => handle("Quero falar com o atendimento"));

  const hour = new Date().getHours();
  addMessage(hour < 12 ? "Bom dia! Como posso ajudar?" : hour < 18 ? "Boa tarde! Como posso ajudar?" : "Boa noite! Como posso ajudar?");

  window.__assistant = {classify, updateContext, R, META, CONFIG, state};

  if(new URLSearchParams(location.search).has("test")){
    const tests = [
      ["colar","store_products"],
      ["colar de prata","store_products"],
      ["quero um colar","store_products"],
      ["ola","greeting"],
      ["olá tudo bem","greeting"],
      ["tem joias pra vender?","store_products"],
      ["tenho joias pra vender","sell_gold_silver"],
      ["joias pra vender","sale_direction_clarify"],
      ["gostaria de uma aliança de casamento","rings_order"],
      ["consertam corrente de prata","repair"],
      ["consertam relógio","unsupported_repair"],
      ["vocês fazem conserto","repair_clarify"],
      ["tem boleto","boleto_special"],
      ["qual o valor do ouro","gold_price_clarify"],
      ["fazem anel de moeda","unsupported_material"],
      ["o frete é gratis","shipping"],
      ["a gravação é gratuita","engraving"],
      ["qual a garantia da semijoia","semijewelry_warranty"],
      ["quanto custa uma pulseira","store_products"]
    ];

    const failures = [];
    for(const [question, expected] of tests){
      state.context = null;
      const got = classify(question);
      if(got !== expected) failures.push({question, expected, got});
    }

    state.context = null;
    const first = classify("outra peça");
    updateContext(first);
    const second = classify("colar");
    if(first !== "commercial_clarify" || second !== "store_products"){
      failures.push({sequence:["outra peça","colar"], expected:["commercial_clarify","store_products"], got:[first,second]});
    }

    const tooLong = Object.entries(R).flatMap(([topic, list]) => list
      .filter((text) => text.replace(/<[^>]+>/g, "").length > 180)
      .map((text) => ({topic, length:text.length, text}))
    );

    const output = $("#test-results");
    output.style.display = "block";
    output.textContent = JSON.stringify({total:tests.length + 1, passed:tests.length + 1 - failures.length, failures, tooLong}, null, 2);
    document.title = failures.length || tooLong.length ? "TEST_FAIL" : "TEST_OK";
  }
})();
