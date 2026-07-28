const { test, expect } = require('@playwright/test');

// Execução final da revisão 65: mudanças de escolha devem preservar o restante do pedido.
async function openAssistant(page){
  await page.goto('/assistente/?build=correction-test-65');
  await expect(page.locator('#question')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => Boolean(
    window.__correcoesContextoV1 &&
    window.__correcoesPrioridadeV1 &&
    window.__catalogoConversaV2 &&
    window.__EMP24K_ROUTING__
  ))).toBe(true);
}

async function send(page, text){
  await page.locator('#question').fill(text);
  await page.locator('#composer').evaluate((form) => form.requestSubmit());
}

async function startAllianceSelection(page){
  await send(page, 'quero ver alianças de prata 925');
  const model = page.locator('button[data-ring-model]').first();
  await expect(model).toBeVisible();
  await model.click();
  const format = page.locator('button[data-conversation-external-profile="Abaulado"]');
  await expect(format).toBeVisible();
  await format.click();
  await expect.poll(async () => page.evaluate(() => window.__catalogoConversaV2.flow.stage)).toBe('sizes');
}

async function finishAllianceSelection(page){
  await startAllianceSelection(page);
  await page.getByRole('button', { name: 'Ainda não sei os aros' }).click();
  await page.getByRole('button', { name: 'Ainda não decidi a gravação' }).click();
  await expect(page.getByRole('link', { name: 'Continuar com este modelo' })).toBeVisible();
  await expect(page.locator('[data-correction-review="1"]')).toBeVisible();
}

test('corrige a gravação depois do resumo sem perder modelo, formato ou aros', async ({ page }) => {
  await openAssistant(page);
  await finishAllianceSelection(page);

  const before = await page.evaluate(() => ({
    model:window.__catalogoConversaV2.flow.selected.name,
    format:window.__catalogoConversaV2.flow.externalProfile,
    sizes:window.__catalogoConversaV2.flow.sizes
  }));

  await send(page, 'na verdade quero que esteja gravado para sempre em ambas');

  await expect(page.getByText(/para sempre.*ambas as alianças/i).last()).toBeVisible();
  const after = await page.evaluate(() => ({
    model:window.__catalogoConversaV2.flow.selected.name,
    format:window.__catalogoConversaV2.flow.externalProfile,
    sizes:window.__catalogoConversaV2.flow.sizes,
    engraving:window.__catalogoConversaV2.flow.engraving
  }));

  expect(after.model).toBe(before.model);
  expect(after.format).toBe(before.format);
  expect(after.sizes).toBe(before.sizes);
  expect(after.engraving).toMatch(/para sempre.*ambas as alianças/i);

  const href = await page.locator('[data-correction-continue="1"] a').getAttribute('href');
  const whatsappMessage = new URL(href).searchParams.get('text');
  expect(whatsappMessage).toMatch(/Gravação:.*para sempre.*ambas as alianças/i);
});

test('oferece botões para alterar modelo, formato, aros ou gravação', async ({ page }) => {
  await openAssistant(page);
  await finishAllianceSelection(page);

  const review = page.locator('[data-correction-review="1"]');
  await expect(review.getByRole('button', { name: 'Alterar modelo ou material' })).toBeVisible();
  await expect(review.getByRole('button', { name: 'Alterar formato' })).toBeVisible();
  await expect(review.getByRole('button', { name: 'Alterar aros' })).toBeVisible();
  await expect(review.getByRole('button', { name: 'Alterar gravação' })).toBeVisible();

  await review.getByRole('button', { name: 'Alterar aros' }).click();
  await send(page, 'aros 17 e 22');
  await expect(page.getByText(/Aros: 17 e 22/i).last()).toBeVisible();
  await expect(page.locator('[data-correction-continue="1"] a')).toBeVisible();
});

test('aceita correção de outra escolha enquanto ainda pergunta os aros', async ({ page }) => {
  await openAssistant(page);
  await startAllianceSelection(page);

  await send(page, 'na verdade prefiro chanfrado');
  const state = await page.evaluate(() => ({
    format:window.__catalogoConversaV2.flow.externalProfile,
    stage:window.__catalogoConversaV2.flow.stage
  }));
  expect(state.format).toMatch(/Chanfrado/i);
  expect(state.stage).toBe('sizes');
  await expect(page.getByText(/Continuamos de onde paramos.*numerações/i).last()).toBeVisible();

  await send(page, '17 e 22');
  await expect.poll(async () => page.evaluate(() => window.__catalogoConversaV2.flow.stage)).toBe('engraving');
});

test('troca de modelo ou material reabre o catálogo para recalcular o valor', async ({ page }) => {
  await openAssistant(page);
  await finishAllianceSelection(page);

  await page.locator('[data-correction-review="1"]').getByRole('button', { name: 'Alterar modelo ou material' }).click();
  await expect(page.getByRole('button', { name: 'Ver modelos em ouro 18k' }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver modelos em prata 925' }).last()).toBeVisible();
  await expect(page.getByText(/reabrir o catálogo.*valor/i).last()).toBeVisible();
  expect(await page.evaluate(() => window.__catalogoConversaV2.flow.selected)).toBeNull();
});

test('atualiza um projeto personalizado quando o cliente corrige a ideia', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'quero criar um pingente personalizado');
  await expect(page.getByText(/Me conte qual peça deseja|Me conte.*detalhes/i).last()).toBeVisible();
  await expect(page.locator('.action-btn.wa')).toHaveCount(0);

  await send(page, 'pingente em ouro 18k com iniciais e uma pedra');
  const projectLink = page.getByRole('link', { name: 'Enviar projeto pelo WhatsApp' });
  await expect(projectLink).toBeVisible();

  await send(page, 'na verdade quero em prata 925 sem pedra');
  await expect(page.getByText(/Atualizei a descrição do projeto.*prata 925 sem pedra/i).last()).toBeVisible();
  const corrected = page.getByRole('link', { name: 'Enviar projeto corrigido pelo WhatsApp' });
  await expect(corrected).toBeVisible();
  await expect(corrected).toHaveAttribute('href', /phone=5541998518452/);
  const correctedMessage = new URL(await corrected.getAttribute('href')).searchParams.get('text');
  expect(correctedMessage).toMatch(/pingente/i);
  expect(correctedMessage).toMatch(/iniciais/i);
  expect(correctedMessage).toMatch(/prata 925 sem pedra/i);
  await expect(projectLink).toHaveCount(0);
});

test('mudança entre fabricar com ouro e abater no valor remove a ação antiga', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'aceitam meu ouro para uma aliança?');
  await send(page, 'quero fazer a aliança com meu ouro');
  await expect(page.getByRole('link', { name: 'Avaliar ouro para fabricação' })).toBeVisible();

  await send(page, 'na verdade quero usar o ouro para abater no valor');
  await expect(page.getByRole('link', { name: 'Avaliar ouro para fabricação' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Avaliar ouro e aliança' })).toBeVisible();
});
