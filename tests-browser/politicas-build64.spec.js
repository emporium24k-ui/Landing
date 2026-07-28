const { test, expect } = require('@playwright/test');

async function openAssistant(page){
  await page.goto('/assistente/?build=policy-test-64');
  await expect(page.locator('#question')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => Boolean(window.__EMP24K_ROUTING__ && window.__pagamentoSiteV1))).toBe(true);
}

test('configuração central de pagamento coincide com o site', async ({ page }) => {
  await openAssistant(page);
  const payment = await page.evaluate(() => window.__EMP24K_CONFIG__.rules.payment);
  expect(payment).toEqual({
    pix: true,
    pixDiscountPercent: 10,
    boleto: true,
    boletoDiscountPercent: 5,
    boletoInstallments: false,
    creditCardMaximumInstallments: 10,
    creditCardInterestFree: true,
    discountsMayNotCombineWithPromotions: true
  });
});

test('roteamento mantém somente os três fluxos no responsável', async ({ page }) => {
  await openAssistant(page);
  const routes = await page.evaluate(() => {
    const routing = window.__EMP24K_ROUTING__;
    return {
      gold:routing.routeForText('quero vender minhas joias de ouro'),
      repair:routing.routeForText('preciso consertar e polir meu anel'),
      custom:routing.routeForText('quero criar um pingente personalizado'),
      alliance:routing.routeForText('quero comprar alianças de casamento')
    };
  });

  expect(routes.gold).toBe('5541998518452');
  expect(routes.repair).toBe('5541998518452');
  expect(routes.custom).toBe('5541998518452');
  expect(routes.alliance).toMatch(/^554199(5888995|5776736)$/);
});

test('classificador de pagamento rejeita condição antiga de 12x', async ({ page }) => {
  await openAssistant(page);
  const result = await page.evaluate(() => ({
    card:window.__pagamentoSiteV1.response(window.__pagamentoSiteV1.classify('vocês fazem em 12 vezes?')),
    boleto:window.__pagamentoSiteV1.response(window.__pagamentoSiteV1.classify('tem boleto parcelado?'))
  }));

  expect(result.card).toContain('10x sem juros');
  expect(result.card).not.toContain('12x');
  expect(result.boleto).toContain('à vista');
  expect(result.boleto).toContain('5% de desconto');
});
