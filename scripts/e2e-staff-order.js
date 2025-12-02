/**
 * E2E: Fluxo do staff – seleciona mesa, adiciona produtos ao carrinho e finaliza pedido.
 * Uso: node scripts/e2e-staff-order.js
 * Requisitos:
 *  - Dev server rodando em http://localhost:3001/
 *  - DB seed executado (usuarios, produtos, mesas)
 *  - Puppeteer instalado (devDependency)
 *
 * Observação: Este script é temporário e será removido após teste 100%.
 */

const puppeteer = require('puppeteer');

async function waitAndClick(page, selector, opts = {}) {
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  await page.click(selector, opts);
}
// Puppeteer v22 compatibility: find element by text without XPath
async function clickByTextCompat(page, tag, text) {
  const handle = await page.waitForFunction(
    (t, innerText) => {
      const els = Array.from(document.querySelectorAll(t));
      return els.find((el) => (el.textContent || '').includes(innerText)) || null;
    },
    { timeout: 15000 },
    tag,
    text
  );
  const el = await handle.asElement();
  if (!el) throw new Error(`Elemento <${tag}> com texto "${text}" não encontrado`);
  await el.click();
}

// Clicar no primeiro h3 que contenha "Mesa" usando avaliação direta de ElementHandle
async function clickFirstMesaHeading(page) {
  await page.waitForSelector('h3', { timeout: 15000 });
  const headings = await page.$$('h3');
  for (const h of headings) {
    const txt = await page.evaluate(el => (el.textContent || ''), h);
    if (txt.includes('Mesa')) {
      try {
        // preferir clicar no Card raiz (classe cursor-pointer)
        const clickedViaCard = await page.evaluate(el => {
          const card = el.closest('.cursor-pointer');
          if (card) {
            card.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            return true;
          }
          return false;
        }, h);
        if (!clickedViaCard) {
          await h.click();
        }
        // aguardar marcação de seleção aparecer
        const selectedAppeared = await page.waitForFunction(() => document.body.textContent?.includes('Mesa Selecionada'), { timeout: 5000 }).catch(() => null);
        if (selectedAppeared) return;
        // fallback por coordenadas
        const box = await h.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          const selectedAppeared2 = await page.waitForFunction(() => document.body.textContent?.includes('Mesa Selecionada'), { timeout: 5000 }).catch(() => null);
          if (selectedAppeared2) return;
        }
        return;
      } catch (_) {
        // fallback: disparar evento de clique via JS
        await page.evaluate(el => {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }, h);
        const selectedAppeared3 = await page.waitForFunction(() => document.body.textContent?.includes('Mesa Selecionada'), { timeout: 5000 }).catch(() => null);
        if (selectedAppeared3) return;
        return;
      }
    }
  }
  throw new Error('Não encontrou nenhum <h3> com texto contendo "Mesa"');
}

async function clickByText(page, tag, text) {
  const escaped = text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const xpath = `//${tag}[contains(normalize-space(.), '${escaped}')]`;
  await page.waitForXPath(xpath, { timeout: 15000 });
  const [el] = await page.$x(xpath);
  if (!el) throw new Error(`Elemento <${tag}> com texto "${text}" não encontrado`);
  await el.click();
}

async function waitAndType(page, selector, text) {
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  await page.click(selector, { clickCount: 3 });
  await page.type(selector, text, { delay: 10 });
}

async function expectText(page, selector, text) {
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  const content = await page.$eval(selector, el => el.textContent || '');
  if (!content.includes(text)) {
    throw new Error(`Esperado texto "${text}" em ${selector}, recebido: "${content}"`);
  }
}

async function run() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    // 1) Login como funcionário
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
    await waitAndType(page, 'input[name="email"]', 'funcionario@lanchonete.com');
    await waitAndType(page, 'input[name="password"]', '123456');
    // Clique no botão Entrar (por tipo submit ou texto)
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await clickByTextCompat(page, 'button', 'Entrar');
    }

    // Verificar que logou: aguardar saída da rota /login
    try {
      await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 15000 });
    } catch (_) {
      // Se não mudou de rota, tentar clicar novamente
      const submitBtnRetry = await page.$('button[type="submit"]');
      if (submitBtnRetry) {
        await submitBtnRetry.click();
        await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 15000 });
      }
    }
    console.log('URL pós-login:', await page.url());

    // Algumas implementações redirecionam para /table-selection ou exibem seleção na home
    // Tentamos ir diretamente para seleção de mesas
    await page.goto(`${baseUrl}/table-selection`, { waitUntil: 'networkidle2' });
    console.log('URL após ir para seleção de mesa:', await page.url());
    const bodySample = await page.evaluate(() => (document.body.textContent || '').slice(0, 200));
    console.log('Body sample:', bodySample);
    // Garantir que a página carregou e está acessível
    await page.waitForFunction(() => document.body.textContent?.includes('Seleção de Mesa') || document.body.textContent?.includes('Selecao de Mesa') || document.body.textContent?.includes('Mesa'), { timeout: 15000 });

    // 2) Selecionar uma mesa disponível e confirmar
    // Na página, clicar em um card com "Mesa <número>"
    await clickFirstMesaHeading(page);
    // Confirmar seleção
    await clickByTextCompat(page, 'button', 'Continuar para Cardápio');
    // Redireciona para cardápio (SPA): aguardar mudança de URL fora de /table-selection
    await page.waitForFunction(() => !location.pathname.includes('/table-selection'), { timeout: 15000 });

    // 3) Adicionar 2 produtos ao carrinho
    // Procurar botões de "Adicionar" dos cards otimizados ou padrão
    const addButtonsTestId = await page.$$('[data-testid="add-to-cart"]');
    let added = 0;
    for (const btn of addButtonsTestId) {
      await btn.click();
      added++;
      if (added >= 2) break;
    }
    if (added < 2) {
      // fallback: buscar qualquer botão com texto Adicionar
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const txt = await page.evaluate(el => (el.textContent || '').trim(), btn);
        if (/Adicionar/i.test(txt)) {
          await btn.click();
          added++;
          if (added >= 2) break;
        }
      }
    }
    if (added < 1) throw new Error('Nenhum produto foi adicionado ao carrinho.');

    // 4) Ir para página do carrinho
    // Tentar header/cart link
    const cartLinks = await page.$$('[href="/cart"]');
    if (cartLinks.length > 0) {
      await cartLinks[0].click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    } else {
      // fallback: clicar por texto
      try {
        await clickByTextCompat(page, 'a', 'Carrinho');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      } catch (_) {
        await page.goto(`${baseUrl}/cart`, { waitUntil: 'networkidle2' });
      }
    }

    // 5) Preencher dados necessários no carrinho se existirem
    // Tipo de entrega: tentar selecionar "mesa" ou "local"
    const hasDeliveryType = await page.$('select[name="deliveryType"], select#deliveryType');
    if (hasDeliveryType) {
      try {
        await page.select('select[name="deliveryType"], select#deliveryType', 'table');
      } catch (_) {}
    }

    // Método de pagamento: tentar selecionar a primeira opção disponível
    const hasPaymentSelect = await page.$('select[name="paymentMethod"], select#paymentMethod');
    if (hasPaymentSelect) {
      try {
        const options = await page.$$eval('select[name="paymentMethod"] option, select#paymentMethod option', els => els.map(e => e.value));
        if (options.length) {
          await page.select('select[name="paymentMethod"], select#paymentMethod', options[0]);
        }
      } catch (_) {}
    }

    // Observações (opcional)
    const obsInput = await page.$('textarea[name="notes"], textarea#notes');
    if (obsInput) {
      await obsInput.type('Pedido de teste automatizado pelo staff.', { delay: 10 });
    }

    // 6) Finalizar pedido
    const finalizeBtnTestId = await page.$('[data-testid="finalize-order"]');
    if (finalizeBtnTestId) {
      await finalizeBtnTestId.click();
    } else {
      await clickByTextCompat(page, 'button', 'Finalizar Pedido');
    }

    // 7) Validar sucesso
    // A página exibe "Pedido Enviado com Sucesso!" conforme implementação
    await expectText(page, 'body', 'Pedido Enviado com Sucesso');

    console.log('✅ Fluxo E2E do staff concluído com sucesso.');
    process.exitCode = 0;
  } catch (err) {
    console.error('❌ Erro no fluxo E2E:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();