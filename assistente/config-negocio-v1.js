((root, factory) => {
  const api = factory();
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  if(root) root.__EMP24K_CONFIG__ = api;
})(typeof window !== "undefined" ? window : globalThis, () => {
  "use strict";

  return Object.freeze({
    version: "20260727-49",
    company: Object.freeze({
      name: "Emporium24k",
      assistant: "Coroa 24K",
      address: "R. Jorn. Alceu Chichorro, 305 - Lj nº 14 - Bairro Alto, Curitiba - PR, 82820-290",
      presencial: "Curitiba e região"
    }),
    contacts: Object.freeze({
      boss: "5541998518452",
      allianceSales: Object.freeze(["5541995888995", "5541995776736"]),
      services: "5541998518452",
      metalsEvaluation: "5541998518452"
    }),
    store: Object.freeze({
      home: "https://www.emporium24k.com.br/",
      products: "https://www.emporium24k.com.br/produtos/",
      search: "https://www.emporium24k.com.br/search/?q=",
      alliancesGold: "https://www.emporium24k.com.br/aliancas/ouro-18k/",
      alliancesSilver: "https://www.emporium24k.com.br/aliancas/prata/",
      semijewelry: "https://www.emporium24k.com.br/semijoias/"
    }),
    rules: Object.freeze({
      jewelryMaterials: Object.freeze(["ouro 18k", "prata 925"]),
      allianceGoldKaratsAvailable: Object.freeze(["10k", "18k"]),
      allianceGoldKaratsUnavailable: Object.freeze(["14k", "24k"]),
      engraving: Object.freeze({position: "interna", included: true, maxCharacters: 15}),
      allianceProductionMaximumDays: 7,
      shipping: Object.freeze({
        goldAlliancesFree: true,
        silverAlliancesFree: false,
        jewelryFree: true,
        semijewelryFree: true,
        method: "Sedex"
      }),
      silverAlliancePromotionsMention: false,
      goldAllianceSellerDiscount: true,
      referenceImageChannel: "WhatsApp",
      readyJewelryPurchaseChannel: "site",
      alliancePurchaseChannel: "vendedor",
      adjustsRingSizeAlways: true,
      customWithCustomerGold: true
    })
  });
});
