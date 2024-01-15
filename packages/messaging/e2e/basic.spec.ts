import type { Page } from '@playwright/test';
import { expect, setupStaticServer, test } from './context';
import { wait } from '@modern-js/utils';
import type { WebxMessage } from '@/shared';

const getWebpageURL = setupStaticServer();

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

  await wait(300);

  expect(popupLog.map((msg) => msg.data)).toEqual(['from options']);
  expect(optionsLog.map((msg) => msg.data)).toEqual(['from popup']);
  expect(contentScriptLog.map((msg) => msg.data)).toEqual([
    'from options',
    'from popup',
    'from popup to content-script',
  ]);
});
