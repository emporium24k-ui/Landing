((root, factory) => {
  const api = factory();
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  if(root) root.__coreIntencoesV1 = api;
})(typeof window !== "undefined" ? window : globalThis, () => {
  "use strict";

  const ALIASES = Object.freeze({
    vc:"voce", vcs:"voces", conpra:"compram", conprao:"compram", comprao:"compram",
    aliansa:"alianca", aliansas:"aliancas", alinca:"alianca", alincas:"aliancas",
    aliaca:"alianca", aliacas:"aliancas", aliamca:"alianca", aliamcas:"aliancas",
    semijoa:"semijoia", semijoas:"semijoias", corente:"corrente", corentes:"correntes",
    corrnte:"corrente", pulsera:"pulseira", puseira:"pulseira", pingete:"pingente",
    rastrio:"rastreio", rastreameto:"rastreamento", pulimento:"polimento",
    concerto:"conserto", concertar:"consertar", garatia:"garantia", endereso:"endereco",
    freti:"frete", sedx:"sedex", catao:"cartao", bolto:"boleto", piks:"pix",
    personalisado:"personalizado", personalisada:"personalizada", carter:"cartier",
    cartie:"cartier", grummet:"grumet", groumet:"grumet"
  });

  const MODEL_TERMS = Object.freeze([
    "cartier","grumet","veneziana","singapura","piastrine","figaro","cubana","cadeado",
    "baiana","riviera","ponto de luz","estrela de davi","espirito santo","sao jorge",
    "olho grego","flor de lis","trevo","crucifixo","cruz","escapulario","coracao",
    "infinito","borboleta","argola","tenis","solitario","aparador","elo portugues",
    "cordao baiano","rabo de rato","3 por 1"
  ]);

  const PRODUCT_TERMS = Object.freeze([
    "alianca","anel","solitario","aparador","corrente","cordao","colar","choker","pulseira",
    "pingente","brinco","tornozeleira","piercing","escapulario","joia","semijoia"
  ]);

  const exactWord = (text, word) => new RegExp(`(?:^|\\s)${word}(?:\\s|$)`).test(text);
  const anyPhrase = (text, phrases) => phrases.some((item) => text.includes(item));

  function normalize(value){
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/(\d),(\d)/g, "$1.$2")
      .replace(/[^a-z0-9.\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((word) => ALIASES[word] || word)
      .join(" ");
  }

  function firstPhrase(text, phrases){
    return phrases.find((item) => text.includes(item)) || null;
  }

  function productFrom(text){
    const plurals = {
      aliancas:"alianca", aneis:"anel", solitarios:"solitario", aparadores:"aparador",
      correntes:"corrente", cordoes:"cordao", colares:"colar", chokers:"choker",
      pulseiras:"pulseira", pingentes:"pingente", brincos:"brinco", tornozeleiras:"tornozeleira",
      piercings:"piercing", escapularios:"escapulario", joias:"joia", semijoias:"semijoia"
    };
    for(const token of text.split(" ")){
      const singular = plurals[token] || token;
      if(PRODUCT_TERMS.includes(singular)) return singular;
    }
    return null;
  }

  function materialFrom(text){
    if(/\bouro\s*10k\b|\b10k\b|\b10 quilates\b/.test(text)) return "ouro 10k";
    if(/\bouro\s*14k\b|\b14k\b|\b14 quilates\b/.test(text)) return "ouro 14k";
    if(/\bouro\s*24k\b|\b24k\b|\b24 quilates\b|\bouro puro\b/.test(text)) return "ouro 24k";
    if(/\bouro\s*18k\b|\b18k\b|\b18 quilates\b|\bouro 750\b/.test(text)) return "ouro 18k";
    if(/\bprata\s*925\b|\b925\b/.test(text)) return "prata 925";
    if(/\bsemijoia\b|\bbanhad[ao]\b|\bfolhead[ao]\b/.test(text)) return "semijoia";
    if(exactWord(text, "ouro")) return "ouro";
    if(exactWord(text, "prata")) return "prata";
    return null;
  }

  function modelFrom(text){
    const known = firstPhrase(text, MODEL_TERMS);
    if(known) return known;
    const explicit = text.match(/\b(?:modelo|estilo)\s+([a-z0-9. ]{2,60})/);
    return explicit ? explicit[1].trim().split(" ").slice(0, 5).join(" ") : null;
  }

  function dimensionsFrom(text){
    return text.match(/\b\d+(?:\.\d+)?\s*(?:mm|cm)\b/g) || [];
  }

  function classify(raw, previous = {}){
    const text = normalize(raw);
    const product = productFrom(text);
    const material = materialFrom(text);
    const model = modelFrom(text);
    const dimensions = dimensionsFrom(text);
    const entities = {product, material, model, dimensions};
    if(!text) return {intent:"empty", confidence:1, text, entities};

    const alliance = /\balianca(?:s)?\b/.test(text);
    const price = /\b(valor|valores|preco|precos|quanto custa|quanto fica|quanto sai|orcamento)\b/.test(text);
    const browse = /\b(modelo|modelos|catalogo|opcoes|ver|mostrar|mostra|conhecer|escolher)\b/.test(text);
    const custom = anyPhrase(text, ["personalizada","personalizado","sob medida","do meu jeito","minha ideia","modelo proprio","igual a foto","foto de referencia","desenho"]);
    const shipping = anyPhrase(text, ["frete","sedex","correios","forma de envio","como enviam","envio gratis","frete gratis","entrega em"]);
    const karatQuestion = /\b(10k|14k|18k|24k|10 quilates|14 quilates|18 quilates|24 quilates|ouro puro)\b/.test(text) && anyPhrase(text,["fazem","fazer","trabalham","trabalha","por que","porque","o que e","qual diferenca"]);

    if(anyPhrase(text, ["rastreio","rastreamento","codigo de rastreio","acompanhar pedido","onde esta meu pedido"]))
      return {intent:"tracking", confidence:.99, text, entities};

    if(anyPhrase(text, ["ajustar aro","ajustar minha alianca","ajustar minhas aliancas","aumentar aro","diminuir aro","alianca apertada","alianca larga","alianca folgada"]))
      return {intent:"ring_resize", confidence:.99, text, entities};

    if(anyPhrase(text, ["meu ouro","ouro do cliente","eu dou o ouro","eu tenho o ouro","usar meu ouro","levar meu ouro","so mao de obra","somente mao de obra"]) && (alliance || anyPhrase(text,["fabricar","fazer","produzir"])))
      return {intent:"customer_gold_alliance", confidence:.99, text, entities};

    if(anyPhrase(text, ["quero vender","gostaria de vender","tenho para vender","avaliar meu ouro","avaliar minha prata","quanto pagam","compram meu ouro","compram minha prata","vender ouro","vender prata"]) || /\bvoces compram (?:ouro|prata)\b/.test(text))
      return {intent:"sell_metals", confidence:.99, text, entities};

    if(anyPhrase(text, ["conserto","consertar","reparar","soldar","quebrou","polimento","polir","pedra caiu"]))
      return {intent:"repair_service", confidence:.96, text, entities};

    if(shipping){
      const inheritedMaterial = material || previous.material || null;
      const inheritedProduct = product || previous.product || null;
      return {intent:"shipping", confidence:.97, text, entities:{...entities, material:inheritedMaterial, product:inheritedProduct}};
    }

    if(karatQuestion) return {intent:"material_education", confidence:.98, text, entities};
    if(alliance && custom) return {intent:"alliance_custom", confidence:.98, text, entities};
    if(alliance && (browse || price || model || material)) return {intent:"alliance_catalog", confidence:.97, text, entities};
    if(alliance) return {intent:"alliance_interest", confidence:.9, text, entities};

    if(anyPhrase(text, ["quem sao voces","quem e voce","o que e a emporium","que empresa e essa","coroa 24k"]))
      return {intent:"identity", confidence:.98, text, entities};

    if(anyPhrase(text, ["banho de ouro","banhar minha","banhar uma","dar banho","fazem banho"]))
      return {intent:"semijewelry_bath_service", confidence:.97, text, entities};

    if(anyPhrase(text, ["ouro 24k","24 quilates","ouro puro","ouro 14k","14 quilates","ouro 10k","10 quilates","ouro 18k","prata 925","o que e ouro","o que e prata","diferenca entre ouro e prata"]))
      return {intent:"material_education", confidence:.97, text, entities};

    if(anyPhrase(text, ["gravacao","gravar","nome dentro","data dentro","frase dentro","quantos caracteres"]))
      return {intent:"engraving", confidence:.97, text, entities};

    if(anyPhrase(text, ["pix","cartao","boleto","pagamento","parcelamento","parcela","entrada","pagar na entrega"]))
      return {intent:"payment", confidence:.96, text, entities};

    if(price && !product && !material && !model) return {intent:"price_general", confidence:.94, text, entities};

    const readyProduct = product && !["alianca"].includes(product);
    const purchaseIntent = anyPhrase(text, ["quero","queria","gostaria","procuro","busco","tem","vende","vendem","comprar","valor","preco","mostrar","ver"]);
    if((readyProduct || model) && purchaseIntent)
      return {intent:"ready_product_search", confidence:.95, text, entities};

    if(anyPhrase(text, ["endereco","onde fica","loja fisica","curitiba","bairro alto"]))
      return {intent:"location", confidence:.96, text, entities};

    if(anyPhrase(text, ["garantia","certificado","nota fiscal","autenticidade","procedencia","confiavel","golpe"]))
      return {intent:"trust", confidence:.94, text, entities};

    if(/^(oi|ola|bom dia|boa tarde|boa noite|eai)\b/.test(text)) return {intent:"greeting", confidence:.9, text, entities};
    if(anyPhrase(text, ["obrigado","obrigada","valeu","agradeco"])) return {intent:"thanks", confidence:.95, text, entities};

    return {intent:"unknown", confidence:.25, text, entities};
  }

  return Object.freeze({normalize, classify, productFrom, materialFrom, modelFrom});
});
