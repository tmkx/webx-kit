import type { Page } from '@playwright/test';
import { setupStaticServer, sleep } from '@webx-kit/test-utils/playwright';
import { expect, test } from './context';
import type { connections } from '@/background';
import type { send, on, request, stream } from '@/client-base';
import type { WebxMessage } from '@/shared';

const getWebpageURL = setupStaticServer(test);

declare module globalThis {
  /** only in background */
  const __webxConnections: typeof connections | undefined;
  const __send: typeof send;
  const __on: typeof on;
  const __request: typeof request;
  const __stream: typeof stream;
}

test('Background', async ({ background }) => {
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

  await optionsPage.evaluate(() => globalThis.__send('options', { to: 'popup' }));
  const popupResponse = await popupPage.evaluate(() => globalThis.__request('popup', { to: 'options' }));
  await popupPage.evaluate(() => globalThis.__send('popup to content-script', { to: 'content-script' }));

  expect(popupResponse).toEqual({ reply: 'options', data: 'popup' });

  await sleep(300);

  function mapLog(msg: WebxMessage) {
    return { tabId: msg.tabId, data: msg.data };
  }

  expect(popupLog.map(mapLog)).toEqual([
    { tabId: expect.any(Number), data: 'options' },
    { tabId: expect.any(Number), data: { reply: 'options', data: 'popup' } },
  ]);
  expect(optionsLog.map(mapLog)).toEqual([{ tabId: expect.any(Number), data: 'popup' }]);
  expect(contentScriptLog.map(mapLog)).toEqual([{ tabId: expect.any(Number), data: 'popup to content-script' }]);
});

test('Stream', async ({ context, getURL }) => {
  const optionsPage = await context.newPage();

  await optionsPage.goto(await getURL('options.html'));

  const result = await optionsPage.evaluate(() => {
    return new Promise<unknown[]>((resolve) => {
      const result: unknown[] = [];
      globalThis.__stream('options', {
        next: (value) => result.push(value),
        complete: () => resolve(result),
      });
    });
  });

  expect(result).toEqual([1, 2, 3]);
});
