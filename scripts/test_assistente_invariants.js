#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const index = read("assistente/index.html");
const configSource = read("assistente/config-negocio-v1.js");
const coordinator = read("assistente/coordenador-central-v1.js");
const topCta = read("assistente/top-cta-v1.js");
const visualCatalog = read("assistente/catalogo-loja-visual-v1.js");
const officialCatalog = read("assistente/catalogo-oficial-v1.js");
const comfort = read("assistente/conforto-interno-v1.js");
const formatFlow = read("assistente/formato-externo-v1.js");
const catalogConversation = read("assistente/catalogo-conversa-v2.js");
const recovery = read("assistente/recuperacao-conversa-v1.js");
const session = read("assistente/sessao-conversa-v1.js");
const legacyRouting = read("assistente/roteamento-legado-v1.js");
const analytics = read("assistente/analytics-bridge-v1.js");
const syncWorkflow = read(".github/workflows/sync-store-catalog.yml");

const expectedFallbacks = [
  "ortografia-v1.js", "referencia-whatsapp-v1.js", "tom-humano-v1.js", "ajuste-aro-v1.js",
  "valor-variacoes-v1.js", "identidade-v1.js", "ouro-na-alianca-v1.js", "teores-materiais-v1.js",
  "venda-metais-v1.js", "seguranca-entrega-v1.js", "banho-semijoias-v1.js", "valor-personalizado-v1.js",
  "catalogo-aliancas-v1.js", "gravacao-limite-v2.js", "catalogo-conversa-v2.js", "desconto-catalogo-v1.js",
  "frete-prata-v1.js", "rota-produtos-site-v1.js", "modelo-especifico-v1.js", "primeiro-contato-v3.js",
  "rastreamento-v1.js", "maquininha-v1.js", "cartao-distancia-prazo-v1.js", "encapada-hotfix-v1.js",
  "personalizados-v1.js", "pagamento-v2.js", "endereco-polimento-v2.js", "entrega-presencial-v1.js",
  "trust-v2.js", "catalog-hotfix-v3.js", "app-concise-v3.js"
];

for(const file of expectedFallbacks){
  assert.ok(index.includes(file), `Fluxo antigo preservado e carregado: ${file}`);
}

const order = [
  "config-negocio-v1.js", "core-intencoes-v1.js", "sessao-conversa-v1.js", "coordenador-central-v1.js",
  "metricas-v1.js", "analytics-bridge-v1.js", "top-cta-v1.js", "catalogo-loja-dados.js",
  "roteamento-legado-v1.js", "catalogo-loja-visual-v1.js", "conforto-interno-v1.js",
  "catalogo-dados-oficiais.js", "catalogo-aliancas-v1.js", "catalogo-oficial-v1.js",
  "formato-externo-v1.js", "catalogo-conversa-v2.js", "rota-produtos-site-v1.js",
  "recuperacao-conversa-v1.js", "app-concise-v3.js"
];
let previous = -1;
for(const file of order){
  const current = index.indexOf(file);
  assert.ok(current > previous, `Ordem de carregamento inválida para ${file}`);
  previous = current;
}

assert.ok(configSource.includes('boss: "5541998518452"'), "Telefone do chefe precisa permanecer centralizado");
assert.ok(configSource.includes('maxCharacters: 15'), "Limite de gravação precisa permanecer em 15 caracteres");
assert.ok(configSource.includes('silverAlliancesFree: false'), "Alianças de prata não podem ter frete grátis");
assert.ok(configSource.includes('silverAlliancePromotionsMention: false'), "Promoções não podem ser mencionadas para prata");
assert.ok(configSource.includes('allianceGoldKaratsAvailable: Object.freeze(["10k", "18k"])'), "Teores disponíveis das alianças precisam ser 10k e 18k");

assert.ok(topCta.includes("contacts.boss"), "Botão superior deve usar o telefone central do chefe");
assert.ok(!topCta.includes("Math.random"), "Botão superior não pode distribuir o contato aleatoriamente");
assert.ok(topCta.includes("buildSummary"), "Botão superior deve enviar resumo da conversa");

assert.ok(coordinator.includes("previousIntent === \"repair_service\""), "Mudança de assunto não pode herdar produto antigo em consertos");
assert.ok(coordinator.includes("ouro 10k e ouro 18k"), "Proteção de teores precisa estar presente");
assert.ok(coordinator.includes("15 caracteres"), "Proteção da gravação precisa estar presente");
assert.ok(coordinator.includes("alianças de prata 925"), "Proteção do frete da prata precisa estar presente");
assert.ok(coordinator.includes("anexado no WhatsApp"), "Referências precisam ser enviadas pelo WhatsApp");

assert.ok(visualCatalog.includes("hasSpecificRequest"), "Catálogo visual precisa bloquear buscas vagas");
assert.ok(visualCatalog.includes('product.category === "alianca"'), "Catálogo visual de produtos prontos não pode misturar alianças");
assert.ok(officialCatalog.includes('const IMAGE_BUILD = "20260728-59"'), "Imagens oficiais precisam usar versão própria contra cache antigo");
assert.ok(officialCatalog.includes("model.imageSource = official.image_source"), "Catálogo precisa manter uma fonte direta alternativa da loja");
assert.ok(officialCatalog.includes('button.dataset.imageLoaded = "1"'), "Imagem precisa marcar carregamento real para validação");
assert.ok(index.includes('catalogo-oficial-v1.js?v=20260728-59'), "Página precisa carregar a versão nova do catálogo visual");

assert.ok(comfort.includes("Parte interna das alianças"), "Comparação de anatômico, semianatômico e interno reto precisa estar presente");
assert.ok(comfort.includes("Formatos visuais das alianças"), "Comparação visual de abaulado, reto e chanfrado precisa estar presente");
assert.ok(comfort.includes("Anatômico") && comfort.includes("Semianatômico") && comfort.includes("Interno reto"), "Os três formatos internos precisam ser nomeados");
assert.ok(comfort.includes("internalDiagram") && comfort.includes("externalDiagram"), "As duas comparações precisam usar desenhos próprios em SVG");
assert.ok(comfort.includes("data-comfort-visual") && comfort.includes("data-profile-visual"), "As seis figuras precisam ser identificáveis nos testes de navegador");
assert.ok(index.includes('conforto-interno-v1.js?v=20260728-60'), "Página precisa carregar a versão visual corrigida do conforto interno");

assert.ok(catalogConversation.includes('flow.stage = "external_profile"'), "Formato precisa ser escolhido antes dos aros");
assert.ok(formatFlow.includes("profileSvg"), "As escolhas de formato precisam possuir desenho em SVG");
assert.ok(formatFlow.includes('decorateFormatButton(button, "abaulado", "Abaulado"'), "Escolha precisa mostrar desenho abaulado");
assert.ok(formatFlow.includes('decorateFormatButton(button, "reto", "Reto/chapado — formato original"'), "Escolha precisa mostrar desenho reto ou chapado");
assert.ok(formatFlow.includes('decorateFormatButton(button, "chanfrado", "Chanfrado/quinado"'), "Escolha precisa mostrar desenho chanfrado ou quinado");
assert.ok(formatFlow.includes('button.dataset.formatVisualReady = "1"'), "Botões desenhados precisam ser identificáveis e não duplicados");
assert.ok(formatFlow.includes('flow.stage = "sizes"'), "Depois do formato o fluxo deve seguir diretamente para os aros");
assert.ok(formatFlow.includes('button[data-conversation-internal-comfort]'), "A etapa antiga de conforto interno precisa ser removida caso apareça");
assert.ok(formatFlow.includes('Formato: $1 |'), "Resumo e WhatsApp precisam guardar apenas uma escolha de formato");
assert.ok(!formatFlow.includes('Agora escolha o <strong>conforto interno</strong>'), "Fluxo comercial não pode perguntar conforto interno novamente");
assert.ok(index.includes('formato-externo-v1.js?v=20260728-60'), "Página precisa carregar os botões visuais de formato");

assert.ok(recovery.includes("Falar com atendente"), "Recuperação deve oferecer atendimento humano");
assert.ok(recovery.includes("config.contacts.boss"), "Recuperação deve usar o telefone do chefe");

assert.ok(session.includes("30 * 60 * 1000"), "Sessão precisa expirar após 30 minutos");
assert.ok(session.includes("clearConversationStorage"), "Expiração precisa continuar limpando a memória antiga");
assert.ok(!session.includes('button.textContent = "Nova"'), "Interface não deve voltar a mostrar o botão Nova");
assert.ok(!session.includes("startNewConversation"), "Fluxo manual de nova conversa deve permanecer removido");

assert.ok(legacyRouting.includes("config.contacts.boss"), "Joias personalizadas devem seguir para o chefe");
assert.ok(!legacyRouting.includes("5541995888995"), "Roteamento prioritário de joias não pode usar vendedor aleatório");
assert.ok(!legacyRouting.includes("5541995776736"), "Roteamento prioritário de joias não pode usar vendedor aleatório");
assert.ok(legacyRouting.includes("if(visualProducts.length) return"), "Busca visual deve continuar prioritária quando encontrar produtos");
assert.ok(legacyRouting.includes("answerProductFallback"), "Busca sem resultado precisa cair na pesquisa exata do site");

assert.ok(analytics.includes("window.dataLayer"), "Eventos precisam estar preparados para analytics central");
assert.ok(analytics.includes("assistant_whatsapp_click"), "Clique no WhatsApp precisa gerar evento de analytics");
assert.ok(syncWorkflow.includes('cron: "40 8 * * *"'), "Catálogo da loja precisa ser sincronizado diariamente");

console.log(`${expectedFallbacks.length + order.length + 55} invariantes verificadas com sucesso.`);