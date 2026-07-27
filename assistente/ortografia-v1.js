(() => {
  "use strict";

  const state = { bypass: false };

  const vocabulary = [
    "alianca", "aliancas", "anel", "aneis", "solitario", "aparador",
    "joia", "joias", "semijoia", "semijoias", "corrente", "correntes",
    "colar", "colares", "pulseira", "pulseiras", "pingente", "pingentes",
    "brinco", "brincos", "tornozeleira", "tornozeleiras",
    "ouro", "prata", "diamante", "zirconia", "safira", "esmeralda", "ametista",
    "rastreio", "rastreamento", "polimento", "conserto", "consertar",
    "garantia", "certificado", "endereco", "frete", "sedex",
    "cartao", "boleto", "parcelamento", "pagamento", "personalizado", "personalizada",
    "cartier", "grumet", "veneziana", "singapura", "piastrine", "figaro", "cubana"
  ];

  const aliases = Object.freeze({
    vc: "voce",
    vcs: "voces",
    oro: "ouro",
    ouuro: "ouro",
    ouroo: "ouro",
    prataa: "prata",
    aliansa: "alianca",
    aliansas: "aliancas",
    alinca: "alianca",
    alincas: "aliancas",
    aliaca: "alianca",
    aliacas: "aliancas",
    aliamca: "alianca",
    aliamcas: "aliancas",
    aliana: "alianca",
    alianas: "aliancas",
    semijoa: "semijoia",
    semijoas: "semijoias",
    semijioa: "semijoia",
    semijioas: "semijoias",
    semijoiaa: "semijoia",
    corente: "corrente",
    corentes: "correntes",
    corrnte: "corrente",
    corrntes: "correntes",
    corrrente: "corrente",
    pulsera: "pulseira",
    pulseras: "pulseiras",
    puseira: "pulseira",
    puseiras: "pulseiras",
    pulseirra: "pulseira",
    pingete: "pingente",
    pingetes: "pingentes",
    pingent: "pingente",
    brincoo: "brinco",
    rastrio: "rastreio",
    rastreioo: "rastreio",
    rastreameto: "rastreamento",
    rastreamnto: "rastreamento",
    rastriamento: "rastreamento",
    rastreamemto: "rastreamento",
    pulimento: "polimento",
    polimeto: "polimento",
    polimnto: "polimento",
    polimemto: "polimento",
    concerto: "conserto",
    concertar: "consertar",
    conserta: "consertar",
    concerta: "consertar",
    consertoo: "conserto",
    garatia: "garantia",
    garntia: "garantia",
    garantIa: "garantia",
    certificadoo: "certificado",
    certficado: "certificado",
    sertificado: "certificado",
    endereso: "endereco",
    enderecoo: "endereco",
    freti: "frete",
    sedx: "sedex",
    sedecs: "sedex",
    catao: "cartao",
    cartaoo: "cartao",
    bolto: "boleto",
    boletto: "boleto",
    piks: "pix",
    pics: "pix",
    personalisado: "personalizado",
    personalisada: "personalizada",
    perssonalizado: "personalizado",
    perssonalizada: "personalizada",
    carter: "cartier",
    cartie: "cartier",
    grummet: "grumet",
    groumet: "grumet"
  });

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function levenshtein(a, b){
    if(a === b) return 0;
    if(!a.length) return b.length;
    if(!b.length) return a.length;
    const previous = Array.from({length: b.length + 1}, (_, index) => index);
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

  function collapseExcessRepeats(word){
    return word.replace(/(.)\1{2,}/g, "$1");
  }

  function fuzzyCorrection(word){
    if(word.length < 5 || /^\d+$/.test(word)) return null;
    const compact = collapseExcessRepeats(word);
    let best = null;
    let bestDistance = 2;
    let ties = 0;

    for(const target of vocabulary){
      if(Math.abs(compact.length - target.length) > 1) continue;
      const distance = levenshtein(compact, target);
      if(distance < bestDistance){
        best = target;
        bestDistance = distance;
        ties = 1;
      }else if(distance === bestDistance){
        ties += 1;
      }
    }

    return bestDistance === 1 && ties === 1 ? best : null;
  }

  function applyGrammar(text){
    let corrected = text;

    corrected = corrected.replace(
      /\b(voces|voce)\s+(?:compra|conpra|comprao|conprao|compram)\s+(ouro|prata)\b/g,
      "$1 compram $2"
    );
    corrected = corrected.replace(
      /\b(?:compra|conpra|comprao|conprao)\s+(ouro|prata)\b/g,
      "compram $1"
    );
    corrected = corrected.replace(/\bvoces\s+(?:faz|fais|faiz)\b/g, "voces fazem");
    corrected = corrected.replace(/\bvoces\s+(?:envia|enviam)\b/g, "voces enviam");
    corrected = corrected.replace(/\bvoces\s+(?:da|dao)\s+banho\b/g, "voces dao banho");
    corrected = corrected.replace(/\bvoces\s+(?:aceita|aceitam)\b/g, "voces aceitam");

    return corrected;
  }

  function correct(value){
    const original = normalize(value);
    if(!original) return { original, corrected: original, changed: false, corrections: [] };

    const corrections = [];
    const words = original.split(" ").map((word) => {
      const alias = aliases[word];
      if(alias && alias !== word){
        corrections.push([word, alias]);
        return alias;
      }

      const fuzzy = fuzzyCorrection(word);
      if(fuzzy && fuzzy !== word){
        corrections.push([word, fuzzy]);
        return fuzzy;
      }
      return word;
    });

    const beforeGrammar = words.join(" ");
    const corrected = applyGrammar(beforeGrammar);
    if(corrected !== beforeGrammar) corrections.push([beforeGrammar, corrected]);

    return {
      original,
      corrected,
      changed: corrected !== original,
      corrections
    };
  }

  function isSafeCorrection(result){
    if(!result.changed || !result.corrections.length) return false;
    if(result.corrected.length > 300) return false;

    const businessTerms = /\b(ouro|prata|alianca|aliancas|anel|aneis|joia|joias|semijoia|semijoias|corrente|pulseira|pingente|brinco|rastreio|rastreamento|polimento|conserto|consertar|garantia|certificado|endereco|frete|sedex|pix|cartao|boleto|pagamento|personalizado|personalizada|cartier|grumet)\b/;
    return businessTerms.test(result.corrected);
  }

  function replaceDisplayedQuestion(messages, previousCount, raw){
    const bubbles = messages.querySelectorAll(".row.user .bubble");
    if(bubbles.length > previousCount){
      bubbles[bubbles.length - 1].textContent = raw;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#composer");
    const input = document.querySelector("#question");
    const messages = document.querySelector("#messages");
    if(!form || !input || !messages) return;

    form.addEventListener("submit", (event) => {
      if(state.bypass){
        state.bypass = false;
        return;
      }

      const raw = String(input.value || "").trim();
      const result = correct(raw);
      if(!isSafeCorrection(result)) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const previousCount = messages.querySelectorAll(".row.user .bubble").length;
      state.bypass = true;
      input.value = result.corrected;
      form.dispatchEvent(new Event("submit", {bubbles: true, cancelable: true}));
      replaceDisplayedQuestion(messages, previousCount, raw);
    }, true);
  });

  window.__ortografiaV1 = { normalize, correct, isSafeCorrection, levenshtein };
})();