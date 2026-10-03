const { test, expect } = require('@playwright/test');

async function openAssistant(page){
  await page.goto('/assistente/?build=size-help-66');
  await expect(page.locator('#question')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => Boolean(
    window.__ajudaArosV1 && window.__catalogoConversaV2 && window.__EMP24K_ROUTING__
  ))).toBe(true);
}

async function send(page, text){
  await page.locator('#question').fill(text);
  await page.locator('#composer').evaluate((form) => form.requestSubmit());
}

async function reachSizes(page){
  await send(page, 'quero ver alianças de prata 925');
  const model = page.locator('button[data-ring-model]').first();
  await expect(model).toBeVisible();
  await model.click();

  const external = page.locator('button[data-conversation-external-profile]').first();
  if(await external.count()){
    await expect(external).toBeVisible();
    await external.click();
  }

  const comfort = page.locator('button[data-conversation-internal-comfort]').first();
  if(await comfort.count()){
    await expect(comfort).toBeVisible();
    await comfort.click();
  }

  await expect.poll(async () => page.evaluate(() => window.__catalogoConversaV2.flow.stage)).toBe('sizes');
}

test('pergunta como descobrir a numeração interrompe a etapa de aros em vez de virar uma numeração', async ({ page }) => {
  await openAssistant(page);
  await reachSizes(page);

  await send(page, 'Como faço para descobrir a numeração dos dedos?');

  await expect(page.getByRole('button', { name: 'Quero descobrir sozinho(a)' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quero ajuda de um vendedor' })).toBeVisible();
  const state = await page.evaluate(() => ({
    stage: window.__catalogoConversaV2.flow.stage,
    sizes: window.__catalogoConversaV2.flow.sizes
  }));
  expect(state.stage).toBe('sizes');
  expect(state.sizes).toBe('');
  await expect(page.getByText(/o que você deseja gravar/i)).toHaveCount(0);
});

test('botão Ainda não sei os aros abre ajuda sem avançar para gravação', async ({ page }) => {
  await openAssistant(page);
  await reachSizes(page);

  await page.getByRole('button', { name: 'Ainda não sei os aros' }).click();

  await expect(page.getByRole('button', { name: 'Quero descobrir sozinho(a)' })).toBeVisible();
  expect(await page.evaluate(() => window.__catalogoConversaV2.flow.stage)).toBe('sizes');
  await expect(page.getByText(/o que você deseja gravar/i)).toHaveCount(0);
});

test('quem não tem anel recebe somente o vídeo 1', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'Como descubro o tamanho do anel?');
  await page.getByRole('button', { name: 'Quero descobrir sozinho(a)' }).click();
  await page.getByRole('button', { name: 'Não tenho um anel' }).click();

  const video = page.locator('video[aria-label*="sem ter um anel"]');
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute('src', './videos/medir-sem-anel.mp4');
  await expect(page.locator('video[src="./videos/medir-com-anel.mp4"]')).toHaveCount(0);
});

test('quem tem um anel recebe somente o vídeo 2', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'Como descubro minhas numerações dos dedos?');
  await page.getByRole('button', { name: 'Quero descobrir sozinho(a)' }).click();
  await page.getByRole('button', { name: 'Tenho um anel que serve' }).click();

  const video = page.locator('video[aria-label*="usando um anel"]');
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute('src', './videos/medir-com-anel.mp4');
  await expect(page.locator('video[src="./videos/medir-sem-anel.mp4"]')).toHaveCount(0);
});

test('ajuda direta usa um dos vendedores de alianças e nunca o especialista', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'Como faço para saber meu aro?');
  const href = await page.getByRole('link', { name: 'Quero ajuda de um vendedor' }).getAttribute('href');
  expect(href).toMatch(/phone=554199(5888995|5776736)/);
  expect(href).not.toContain('5541998518452');
});
