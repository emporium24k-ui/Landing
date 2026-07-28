const { test, expect } = require('@playwright/test');

// Validação do build 64 em celular e computador: roteamento, políticas comerciais e fluxos críticos.
async function openAssistant(page){
  await page.goto('/assistente/?build=browser-test-64');
  await expect(page.locator('#question')).toBeVisible();
  await expect(page.locator('#topCta')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.__EMP24K_CONFIG__?.version)).toBe('20260728-64');
}

async function send(page, text){
  await page.locator('#question').fill(text);
  await page.locator('#composer').evaluate((form) => form.requestSubmit());
}

test('carrega build 64, distribui o botão geral para vendas e não mostra botão Nova', async ({ page }) => {
  await openAssistant(page);
  const url = await page.evaluate(() => window.__topCtaV1?.whatsappUrl?.());
  expect(url).toMatch(/phone=554199(5888995|5776736)/);
  expect(url).not.toContain('phone=5541998518452');
  await expect(page.locator('#newConversation')).toHaveCount(0);
});

test('divisão estável usa os dois vendedores sem trocar o responsável do visitante', async ({ page }) => {
  await openAssistant(page);
  const routed = await page.evaluate(() => {
    const routing = window.__EMP24K_ROUTING__;
    const visitorKey = 'emp24kVisitorRoutingIdV1';
    const agentKey = 'emp24kAllianceSalesAgentV1';

    localStorage.setItem(visitorKey, 'visitor-a');
    localStorage.removeItem(agentKey);
    const firstA = routing.alliancePhone();
    const secondA = routing.alliancePhone();

    localStorage.setItem(visitorKey, 'visitor-b');
    localStorage.removeItem(agentKey);
    const firstB = routing.alliancePhone();

    return {firstA, secondA, firstB, mode:routing.mode};
  });

  expect(routed.mode).toBe('stable-50-50');
  expect(routed.firstA).toBe(routed.secondA);
  expect(new Set([routed.firstA, routed.firstB])).toEqual(new Set(['5541995888995', '5541995776736']));
});

test('estou com ouro pra vender abre avaliação sem pergunta ambígua', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'estou com ouro pra vender');
  await expect(page.getByText(/Compramos ouro e prata|avaliamos ouro e prata/i).last()).toBeVisible();
  const evaluation = page.getByRole('link', { name: 'Falar com o responsável pela avaliação' });
  await expect(evaluation).toBeVisible();
  await expect(evaluation).toHaveAttribute('href', /phone=5541998518452/);
  await expect(page.getByText(/ver joias da loja ou avaliar|não consegui identificar/i)).toHaveCount(0);
});

test('joias pra vender também abre avaliação direta', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'joias pra vender');
  await expect(page.getByText(/Compramos ouro e prata|avaliamos ouro e prata/i).last()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Falar com o responsável pela avaliação' })).toBeVisible();
  await expect(page.getByText(/Não consegui identificar exatamente/i)).toHaveCount(0);
});

test('resposta curta minha recupera uma pergunta ambígua anterior', async ({ page }) => {
  await openAssistant(page);
  await page.evaluate(() => {
    const messages = document.querySelector('#messages');
    const intro = document.querySelector('#intro');
    if(intro) intro.style.display = 'none';
    const row = document.createElement('div');
    row.className = 'row';
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = '♛';
    const stack = document.createElement('div');
    stack.className = 'message-stack';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = 'É para ver joias da loja ou avaliar uma peça sua?';
    stack.appendChild(bubble);
    row.append(avatar, stack);
    messages.appendChild(row);
  });
  await send(page, 'minha');
  await expect(page.getByText(/a peça é sua|Compramos ouro e prata|avaliamos ouro e prata/i).last()).toBeVisible();
  const evaluation = page.getByRole('link', { name: 'Falar com o responsável pela avaliação' });
  await expect(evaluation).toBeVisible();
  await expect(evaluation).toHaveAttribute('href', /phone=5541998518452/);
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

test('personalizado coleta detalhes e encaminha somente ao responsável', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'quero criar um pingente personalizado');
  await expect(page.getByText(/Me conte qual peça deseja|Me conte.*detalhes/i)).toBeVisible();
  await expect(page.locator('.action-btn.wa')).toHaveCount(0);

  await send(page, 'pingente em ouro 18k com as iniciais L e M e uma pedra pequena');
  const contact = page.getByRole('link', { name: 'Enviar projeto pelo WhatsApp' });
  await expect(contact).toBeVisible();
  await expect(contact).toHaveAttribute('href', /phone=5541998518452/);
});

test('conserto e ajuste são encaminhados somente ao responsável', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'quero consertar uma corrente de prata que quebrou');
  const repair = page.getByRole('link', { name: /Enviar foto da peça|Solicitar|atendimento/i }).last();
  await expect(repair).toBeVisible();
  await expect(repair).toHaveAttribute('href', /phone=5541998518452/);
});

test('pagamentos seguem as condições atuais do site', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'quais são as formas de pagamento?');
  const answer = page.getByText(/Pix com 10% de desconto/i).last();
  await expect(answer).toBeVisible();
  await expect(page.getByText(/boleto com 5% de desconto/i).last()).toBeVisible();
  await expect(page.getByText(/cartão de crédito em até 10x sem juros/i).last()).toBeVisible();
  await expect(page.getByText(/12 vezes|acréscimo elevado|encarece/i)).toHaveCount(0);
});

test('boleto parcelado é corrigido para boleto à vista e cartão em 10x', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'vocês têm boleto parcelado?');
  await expect(page.getByText(/boleto.*à vista.*5% de desconto/i).last()).toBeVisible();
  await expect(page.getByText(/cartão de crédito.*até 10x sem juros/i).last()).toBeVisible();
});

test('ouro 10k permanece disponível e ouro 14k indisponível', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'vocês fazem aliança em ouro 10k?');
  await expect(page.getByText(/Fazemos.*ouro 10k/i).last()).toBeVisible();

  await send(page, 'e ouro 14k vocês fazem?');
  await expect(page.getByText(/não trabalhamos.*ouro 14k|ouro 14k.*não/i).last()).toBeVisible();
});

test('aliança encapada oferece 10k, 18k e prata 925 como alternativas', async ({ page }) => {
  await openAssistant(page);
  await send(page, 'vocês fazem aliança encapada?');
  await expect(page.getByText(/ouro 10k.*ouro 18k.*prata 925/i).last()).toBeVisible();
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