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
const recovery = read("assistente/recuperacao-conversa-v1.js");

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
  "config-negocio-v1.js", "core-intencoes-v1.js", "coordenador-central-v1.js", "metricas-v1.js",
  "top-cta-v1.js", "catalogo-loja-dados.js", "catalogo-loja-visual-v1.js", "rota-produtos-site-v1.js",
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
assert.ok(recovery.includes("Falar com atendente"), "Recuperação deve oferecer atendimento humano");
assert.ok(recovery.includes("config.contacts.boss"), "Recuperação deve usar o telefone do chefe");

console.log(`${expectedFallbacks.length + order.length + 17} invariantes verificadas com sucesso.`);
