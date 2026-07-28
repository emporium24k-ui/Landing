#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const core = require("../assistente/core-intencoes-v1.js");
const config = require("../assistente/config-negocio-v1.js");

const cases = [
  ["quero ver modelos de alianças", "alliance_catalog"],
  ["quero ver aliansas de prata", "alliance_catalog"],
  ["quanto custa uma aliança de ouro 18k", "alliance_catalog"],
  ["tem modelo Celeste em prata 925", "alliance_catalog"],
  ["quero fazer uma aliança personalizada", "alliance_custom"],
  ["quero uma aliança do meu jeito", "alliance_custom"],
  ["se eu der o ouro vocês fabricam a aliança", "customer_gold_alliance"],
  ["tenho meu ouro e quero fazer alianças", "customer_gold_alliance"],
  ["quanto fica só a mão de obra com meu ouro para aliança", "customer_gold_alliance"],
  ["quero ajustar minhas alianças", "ring_resize"],
  ["minha aliança está apertada", "ring_resize"],
  ["preciso diminuir o aro", "ring_resize"],
  ["quero vender ouro", "sell_metals"],
  ["estou com ouro pra vender", "sell_metals"],
  ["tô com prata pra vender", "sell_metals"],
  ["estou com uma peça de ouro para avaliar", "sell_metals"],
  ["tenho uma corrente para vender", "sell_metals"],
  ["vcs conprao prata", "sell_metals"],
  ["quanto vocês pagam no ouro", "sell_metals"],
  ["preciso de polimento na aliança", "repair_service"],
  ["minha corrente quebrou e quero consertar", "repair_service"],
  ["como acompanho o rastreio", "tracking"],
  ["meu pedido não chegou, tem código de rastreio", "tracking"],
  ["o frete da aliança de prata é grátis", "shipping"],
  ["quanto é o sedex", "shipping"],
  ["tem corrente cartier", "ready_product_search"],
  ["quero pulseira grummet 4mm", "ready_product_search"],
  ["procuro pingente de são jorge", "ready_product_search"],
  ["tem brinco argola", "ready_product_search"],
  ["quero um colar ponto de luz", "ready_product_search"],
  ["vocês dão banho de ouro em peça de cliente", "semijewelry_bath_service"],
  ["o que é ouro 18k", "material_education"],
  ["por que não fazem ouro 24k", "material_education"],
  ["fazem alianças em ouro 10k", "material_education"],
  ["fazem aliança em ouro 14k", "material_education"],
  ["como funciona a gravação interna", "engraving"],
  ["quantos caracteres posso gravar", "engraving"],
  ["aceitam pix", "payment"],
  ["parcelam no cartão", "payment"],
  ["tem boleto", "payment"],
  ["qual é o valor", "price_general"],
  ["quem são vocês", "identity"],
  ["onde fica a loja", "location"],
  ["vocês emitem nota fiscal", "trust"],
  ["oi boa tarde", "greeting"],
  ["obrigado", "thanks"]
];

let failures = 0;
for(const [message, expected] of cases){
  const result = core.classify(message);
  try{
    assert.equal(result.intent, expected, `${JSON.stringify(message)} deveria ser ${expected}, recebeu ${result.intent}`);
    process.stdout.write(`✓ ${message} -> ${result.intent}\n`);
  }catch(error){
    failures += 1;
    process.stderr.write(`✗ ${error.message}\n`);
  }
}

const shippingFollowUp = core.classify("o frete é grátis?", {material:"prata 925", product:"alianca"});
assert.equal(shippingFollowUp.intent, "shipping");
assert.equal(shippingFollowUp.entities.material, "prata 925");
assert.equal(shippingFollowUp.entities.product, "alianca");

const ownershipFollowUp = core.classify("minha", {intent:"sell_metals", material:"ouro", product:"ouro/prata"});
assert.equal(ownershipFollowUp.intent, "sell_metals");
assert.equal(ownershipFollowUp.entities.material, "ouro");

assert.equal(config.contacts.boss, "5541998518452");
assert.deepEqual(config.rules.allianceGoldKaratsAvailable, ["10k", "18k"]);
assert.equal(config.rules.shipping.silverAlliancesFree, false);
assert.equal(config.rules.shipping.goldAlliancesFree, true);
assert.equal(config.rules.engraving.maxCharacters, 15);
assert.equal(config.rules.silverAlliancePromotionsMention, false);
assert.equal(config.rules.referenceImageChannel, "WhatsApp");

if(failures){
  process.stderr.write(`\n${failures} teste(s) falharam.\n`);
  process.exit(1);
}
process.stdout.write(`\n${cases.length + 12} verificações concluídas com sucesso.\n`);