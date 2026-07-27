const { test, expect } = require('@playwright/test');

async function openAssistant(page){
  await page.goto('/assistente/?build=browser-test');
  await expect(page.locator('#question')).toBeVisible();
  await expect(page.locator('#topCta')).toBeVisible();
}

async function send(page, text){
  await page.locator('#question').fill(text);
  await page.locator('#composer').evaluate((form) => form.requestSubmit());
}

test('carrega e o atendimento superior usa o telefone do chefe', async ({ page }) => {
  await openAssistant(page);
  const url = await page.evaluate(() => window.__topCtaV1?.whatsappUrl?.());
  expect(url).toContain('phone=5541998518452');
  await expect(page.locator('#newConversation')).toBeVisible();
});

test('busca específica mostra produtos ou pesquisa exata sem vendedor', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'tem corrente cartier');
  await expect(page.getByText(/opç(ão|ões) relacionada|pesquisa da loja/i)).toBeVisible();
  const productButtons = page.getByRole('link', { name: 'Ver este produto' });
  const searchButtons = page.getByRole('link', { name: /Ver (todos os resultados|resultados) no site/ });
  await expect(productButtons.or(searchButtons).first()).toBeVisible();
  const sellerLinks = page.locator('a[href*="5541995888995"], a[href*="5541995776736"]');
  await expect(sellerLinks).toHaveCount(0);
});

test('personalizado coleta detalhes antes de mostrar WhatsApp', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'quero criar um pingente personalizado');
  await expect(page.getByText(/Me conte qual peça deseja|Me conte.*detalhes/i)).toBeVisible();
  await expect(page.locator('.action-btn.wa')).toHaveCount(0);

  await send(page, 'pingente em ouro 18k com as iniciais L e M e uma pedra pequena');
  const contact = page.getByRole('link', { name: 'Enviar projeto pelo WhatsApp' });
  await expect(contact).toBeVisible();
  await expect(contact).toHaveAttribute('href', /phone=5541998518452/);
});

test('nova conversa limpa a interface e a memória', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'oi boa tarde');
  await expect(page.locator('.row.user')).toHaveCount(1);
  await Promise.all([
    page.waitForNavigation(),
    page.locator('#newConversation').click()
  ]);
  await expect(page.locator('.row.user')).toHaveCount(0);
  const stored = await page.evaluate(() => sessionStorage.getItem('emp24kAssistantStateV1'));
  expect(stored).toBeNull();
});

test('aliança de prata não recebe frete grátis', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'quero ver alianças de prata 925');
  await expect(page.getByText(/prata 925/i).first()).toBeVisible();
  await send(page, 'o frete é grátis?');
  await expect(page.getByText(/não é grátis|calculado conforme o CEP/i).last()).toBeVisible();
});
