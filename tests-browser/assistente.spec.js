const { test, expect } = require('@playwright/test');

// Valida o assistente em celular e computador, incluindo as ilustrações dos formatos.
async function openAssistant(page){
  await page.goto('/assistente/?build=browser-test');
  await expect(page.locator('#question')).toBeVisible();
  await expect(page.locator('#topCta')).toBeVisible();
}

async function send(page, text){
  await page.locator('#question').fill(text);
  await page.locator('#composer').evaluate((form) => form.requestSubmit());
}

test('carrega, usa o telefone do chefe e não mostra botão Nova', async ({ page }) => {
  await openAssistant(page);
  const url = await page.evaluate(() => window.__topCtaV1?.whatsappUrl?.());
  expect(url).toContain('phone=5541998518452');
  await expect(page.locator('#newConversation')).toHaveCount(0);
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

test('catálogo de alianças mostra imagens realmente carregadas', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'quero ver alianças de prata 925');
  const imageButton = page.locator('button[data-official-catalog-image]').first();
  const image = imageButton.locator('img');
  await expect(imageButton).toBeVisible();
  await expect(image).toBeVisible();
  await expect.poll(async () => image.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
  await expect(imageButton).toHaveAttribute('data-image-loaded', '1');
});

test('aliança de prata não recebe frete grátis', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'quero ver alianças de prata 925');
  await expect(page.getByText(/prata 925/i).first()).toBeVisible();
  await send(page, 'o frete é grátis?');
  await expect(page.getByText(/não é grátis|calculado conforme o CEP/i).last()).toBeVisible();
});

test('escolhas de formato mostram desenhos e seguem direto para os aros', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'quero ver alianças de prata 925');
  const model = page.locator('button[data-ring-model]').first();
  await expect(model).toBeVisible();
  await model.click();

  const abaulado = page.getByRole('button', { name: 'Abaulado' });
  const reto = page.getByRole('button', { name: 'Reto/chapado — formato original' });
  const chanfrado = page.getByRole('button', { name: 'Chanfrado/quinado' });
  await expect(abaulado).toBeVisible();
  await expect(reto).toBeVisible();
  await expect(chanfrado).toBeVisible();
  await expect(abaulado.locator('svg')).toBeVisible();
  await expect(reto.locator('svg')).toBeVisible();
  await expect(chanfrado.locator('svg')).toBeVisible();
  await expect(page.locator('button[data-format-visual-ready="1"]')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Manter o formato do modelo' })).toHaveCount(0);

  await abaulado.click();
  await expect(page.getByRole('button', { name: 'Ainda não sei os aros' })).toBeVisible();
  await expect(page.locator('button[data-conversation-internal-comfort]')).toHaveCount(0);
  await expect(page.getByText(/Agora escolha o conforto interno/i)).toHaveCount(0);
});

test('pergunta mista mostra desenhos externos e internos', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'qual a diferença entre abaulado, semianatômico e interno reto?');
  await expect(page.getByText('Formatos visuais das alianças', { exact: true })).toBeVisible();
  await expect(page.getByText('Parte interna das alianças', { exact: true })).toBeVisible();
  await expect(page.locator('[data-profile-visual]')).toHaveCount(3);
  await expect(page.locator('[data-comfort-visual]')).toHaveCount(3);
  await expect(page.locator('[data-profile-visual] svg')).toHaveCount(3);
  await expect(page.locator('[data-comfort-visual] svg')).toHaveCount(3);
  await expect(page.getByText('Anatômico', { exact: true })).toBeVisible();
  await expect(page.getByText('Semianatômico', { exact: true })).toBeVisible();
  await expect(page.getByText('Interno reto', { exact: true })).toBeVisible();
});