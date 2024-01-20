import type { Page } from '@playwright/test';
import { setupStaticServer, sleep } from '@webx-kit/test-utils/playwright';
import { expect, test } from './context';
import type { WebxMessage } from '@/shared';

const getWebpageURL = setupStaticServer(test);

test('Background', async ({ background }) => {
  // @ts-expect-error
  await expect(background.evaluate(() => typeof globalThis.__webxConnections)).resolves.toBe('object');
});

function collectLogs(page: Page) {
  const consoleLogs: WebxMessage[] = [];
  page.on('console', async (message) => consoleLogs.push(await message.args()[0].jsonValue()));
  return consoleLogs;
}

test('Messaging', async ({ context, getURL }) => {
  const optionsPage = await context.newPage();
  const popupPage = await context.newPage();
  const contentScript = await context.newPage();

  const optionsLog = collectLogs(optionsPage);
  const popupLog = collectLogs(popupPage);
  const contentScriptLog = collectLogs(contentScript);

  await Promise.all([
    optionsPage.goto(await getURL('options.html')),
    popupPage.goto(await getURL('popup.html')),
    contentScript.goto(getWebpageURL()),
  ]);

  // @ts-expect-error
  await optionsPage.evaluate(() => globalThis.__send('from options'));
  // @ts-expect-error
  await popupPage.evaluate(() => globalThis.__send('from popup'));
  // @ts-expect-error
  await popupPage.evaluate(() => globalThis.__send('from popup to content-script', 'content-script'));

  await sleep(300);

  function mapLog(msg: WebxMessage) {
    return { tabId: msg.tabId, data: msg.data };
  }

  expect(popupLog.map(mapLog)).toEqual([{ tabId: expect.any(Number), data: 'from options' }]);
  expect(optionsLog.map(mapLog)).toEqual([{ tabId: expect.any(Number), data: 'from popup' }]);
  expect(contentScriptLog.map(mapLog)).toEqual([
    { tabId: expect.any(Number), data: 'from options' },
    { tabId: expect.any(Number), data: 'from popup' },
    { tabId: expect.any(Number), data: 'from popup to content-script' },
  ]);
});
