(() => {
  "use strict";

  const exact = new Map([
    [
      "Nossos anéis e alianças são feitos sob medida. O atendimento mostra modelos, valores e promoções.",
      "Nossas alianças são feitas sob medida. Você prefere ouro 18k ou prata 925 para eu mostrar os modelos e valores?"
    ],
    [
      "Essas peças são feitas por encomenda, conforme tamanho e modelo. Vou te encaminhar.",
      "Elas são feitas sob medida, conforme o modelo e a numeração. Posso te mostrar as opções por aqui."
    ],
    [
      "Temos, sim. O vendedor confirma a configuração e a melhor condição.",
      "Temos, sim. Você prefere ouro 18k ou prata 925?"
    ],
    [
      "Envie a referência para a equipe montar o orçamento.",
      "Pode enviar a referência e me contar os detalhes que deseja."
    ],
    [
      "O atendimento analisa a ideia e calcula o projeto.",
      "Me conte a ideia e os detalhes para calcular o projeto."
    ],
    [
      "Vou te encaminhar para enviar a foto ou desenho.",
      "Pode enviar a foto ou o desenho de referência."
    ],
    [
      "Adorei esse conceito! Dá para a equipe analisar e transformar em um projeto exclusivo. Envie a referência e os detalhes para montarmos o orçamento.",
      "Essa ideia pode ficar linda. Pode enviar a referência e me contar os detalhes que deseja."
    ],
    [
      "Essa ideia tem tudo para ficar linda! O próximo passo é conferir material, medidas e viabilidade do desenho.",
      "Essa ideia tem tudo para ficar linda! Qual material, medidas e detalhes você imagina?"
    ],
    [
      "Muito boa a ideia! Vamos analisar os detalhes e preparar uma proposta personalizada para você.",
      "Gostei da ideia! Qual material e medidas você tem em mente?"
    ],
    [
      "Ficaria uma peça muito especial! A equipe pode desenvolver o projeto com base nesses detalhes.",
      "Ficaria uma peça muito especial! Podemos desenvolver o projeto a partir desses detalhes."
    ],
    [
      "Para calcular o valor, precisamos entender o modelo, o material, as medidas e os detalhes da personalização. Envie sua ideia para a equipe montar o orçamento.",
      "Para calcular o valor, preciso saber o modelo, o material, as medidas e os detalhes da personalização. Me conte como você imagina a peça."
    ],
    [
      "O orçamento depende do projeto. Com a referência e os detalhes, a equipe calcula a melhor configuração para você.",
      "O orçamento depende do projeto. Com a referência e os detalhes, calculamos a configuração mais adequada."
    ],
    [
      "O prazo depende da peça. O atendente confirma antes do fechamento.",
      "O prazo depende da peça. Para alianças, a produção leva até 7 dias."
    ],
    [
      "A equipe confirma o prazo depois de definir a peça.",
      "Assim que o modelo estiver definido, confirmamos o prazo certinho."
    ],
    [
      "As condições variam conforme o pedido. O atendimento confirma as opções atuais.",
      "Aceitamos Pix e cartão de crédito. No cartão, o parcelamento pode ser feito em até 12 vezes."
    ],
    [
      "Para encomendas, o vendedor verifica a melhor forma de pagamento.",
      "Para encomendas, as formas de pagamento são confirmadas no pedido."
    ],
    [
      "Vou te encaminhar para consultar as condições.",
      "Posso te mostrar as formas de pagamento disponíveis."
    ],
    [
      "As promoções mudam. O vendedor verifica a melhor condição.",
      "As promoções podem mudar conforme o modelo. Posso verificar a condição atual."
    ],
    [
      "Vou te encaminhar para consultar a promoção atual.",
      "Posso verificar a promoção atual para esse modelo."
    ],
    [
      "A equipe consulta usando os dados do pedido.",
      "O rastreamento é consultado com o nome ou número do pedido."
    ],
    [
      "Vou te encaminhar para verificar o rastreio.",
      "Tenha em mãos o nome ou número do pedido para consultar o rastreio."
    ],
    [
      "Vou te encaminhar para o atendimento comercial.",
      "Me diga qual peça você procura e eu te ajudo a seguir."
    ],
    [
      "O vendedor confirma modelos, valores e condições.",
      "Me diga o modelo que procura para eu te mostrar valores e opções."
    ],
    [
      "A equipe ajuda você a escolher a melhor opção.",
      "Posso te ajudar a escolher uma opção."
    ]
  ]);

  function humanize(html){
    let result = String(html || "").trim();
    if(!result || result.includes('class="typing"')) return result;

    const plain = result.replace(/<[^>]+>/g, "").trim();
    if(exact.has(plain)) return exact.get(plain);

    result = result.replace(
      /(?:Ótima escolha! Entendi sua procura|Excelente escolha! Você já trouxe os principais detalhes|Perfeito! Esse é um pedido bem específico):\s*(<strong>.*?<\/strong>)\.\s*Para direcionar o orçamento certinho, falta só confirmar (.*?)\.\s*Já deixei sua solicitação pronta para o vendedor\./i,
      "Entendi: $1. Só preciso confirmar $2 para te mostrar a opção certa."
    );

    result = result.replace(
      /(?:Perfeito! Atualizei sua solicitação|Ótimo, agora ficou ainda mais claro|Excelente, anotei esse detalhe):\s*(<strong>.*?<\/strong>)\.\s*Para direcionar o orçamento certinho, falta só confirmar (.*?)\.\s*Já deixei sua solicitação pronta para o vendedor\./i,
      "Entendi: $1. Agora só preciso confirmar $2."
    );

    result = result.replace(
      /(?:Ótima escolha! Entendi sua procura|Excelente escolha! Você já trouxe os principais detalhes|Perfeito! Esse é um pedido bem específico|Perfeito! Atualizei sua solicitação|Ótimo, agora ficou ainda mais claro|Excelente, anotei esse detalhe):\s*(<strong>.*?<\/strong>)\.\s*Com essas informações, a equipe já consegue verificar disponibilidade ou produção, valor e prazo com precisão\./i,
      "Entendi: $1. Com esses detalhes, já dá para confirmar disponibilidade, valor e prazo."
    );

    result = result.replace(
      /^Ótima escolha!\s*👑?\s*Você selecionou o modelo\s*(<strong>.*?<\/strong>)\s*em\s*(<strong>.*?<\/strong>),\s*por\s*(<strong>.*?<\/strong>)(.*?)\.\s*Para deixar o pedido pronto, envie as duas numerações e a gravação desejada\./i,
      "O modelo $1 em $2 sai por $3$4. Quais são as duas numerações e a gravação desejada?"
    );

    result = result.replace(
      /^Perfeito!\s*Seu interesse ficou organizado:<br><strong>(.*?)<\/strong><br>Agora o atendimento consegue confirmar numerações, promoção vigente, prazo e fechamento com muito mais rapidez\./i,
      "Recebi estes detalhes:<br><strong>$1</strong><br>Agora só falta confirmar as numerações, a condição atual e o prazo."
    );

    result = result.replace(
      /^Perfeito!\s*Organizei sua solicitação:<br><strong>(.*?)<\/strong><br>A equipe poderá analisar a viabilidade, calcular o valor e orientar os próximos passos sem você precisar explicar tudo novamente\./i,
      "Entendi seu projeto:<br><strong>$1</strong><br>Com esses detalhes, já dá para calcular o valor e confirmar a produção."
    );

    result = result.replace(
      /^Sua ideia ficou muito interessante!\s*👑?\s*Anotei o projeto em\s*(<strong>.*?<\/strong>):\s*“(.*?)”\.\s*Para deixar a solicitação pronta, quais são as numerações dos dois aros\?/i,
      "Gostei da ideia para $1: “$2”. Quais são as numerações dos dois aros?"
    );

    result = result
      .replace(/^Parabéns[!,.]?\s*/i, "")
      .replace(/^Ótima escolha!\s*/i, "")
      .replace(/^Excelente escolha!\s*/i, "")
      .replace(/Para direcionar o orçamento certinho, falta só confirmar/gi, "Só preciso confirmar")
      .replace(/Para deixar o pedido pronto, envie/gi, "Agora me diga")
      .replace(/Para deixar a solicitação pronta,/gi, "Agora,")
      .replace(/Já deixei sua solicitação pronta para o vendedor\.?/gi, "")
      .replace(/Agora o atendimento consegue/gi, "Com essas informações, já dá para")
      .replace(/A equipe poderá analisar/gi, "Com esses detalhes, dá para analisar")
      .replace(/A equipe pode desenvolver/gi, "Podemos desenvolver")
      .replace(/A equipe pode ajudar/gi, "Podemos ajudar")
      .replace(/Vou te encaminhar para o atendimento comercial\.?/gi, "Me diga qual peça você procura e eu te ajudo a seguir.")
      .replace(/Vou te encaminhar para enviar a foto ou desenho\.?/gi, "Pode enviar a foto ou o desenho de referência.")
      .replace(/Vou te encaminhar para consultar as condições\.?/gi, "Posso te mostrar as formas de pagamento disponíveis.")
      .replace(/Vou te encaminhar para consultar a promoção atual\.?/gi, "Posso verificar a promoção atual para esse modelo.")
      .replace(/Vou te encaminhar para verificar o rastreio\.?/gi, "Tenha em mãos o nome ou número do pedido para consultar o rastreio.")
      .replace(/Vou te encaminhar\.?/gi, "Posso te ajudar a continuar por aqui.")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+\./g, ".")
      .replace(/\.{2,}/g, ".")
      .trim();

    return result;
  }

  function processBubble(bubble){
    if(!(bubble instanceof HTMLElement) || bubble.dataset.humanized === "1") return;
    if(bubble.closest(".row.user")) return;
    const next = humanize(bubble.innerHTML);
    if(next && next !== bubble.innerHTML) bubble.innerHTML = next;
    bubble.dataset.humanized = "1";
  }

  function processNode(node){
    if(!(node instanceof HTMLElement)) return;
    if(node.matches(".row:not(.user) .bubble")) processBubble(node);
    node.querySelectorAll?.(".row:not(.user) .bubble").forEach(processBubble);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const messages = document.querySelector("#messages");
    if(!messages) return;

    messages.querySelectorAll(".row:not(.user) .bubble").forEach(processBubble);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(processNode));
    });
    observer.observe(messages, {childList: true, subtree: true});
  });

  window.__tomHumanoV1 = {humanize};
})();