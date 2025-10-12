import { setupStaticServer } from '@webx-kit/test-utils/playwright';
import { expect, test } from './context';
import type { Messaging } from '@/core';
import type { WrappedMessaging } from '@/shared';

const getWebpageURL = setupStaticServer(test);

declare namespace globalThis {
  /** only in background */
  const __messaging: Messaging;
  const __clientMessaging: WrappedMessaging;
}

test('Background', async ({ background }) => {
  await expect(background.evaluate(() => typeof globalThis.__messaging)).resolves.toBe('object');
});

test('Messaging', async ({ context, getURL }) => {
  const optionsPage = await context.newPage();
  const popupPage = await context.newPage();
  const contentPage = await context.newPage();

  await Promise.all([
    optionsPage.goto(await getURL('options.html')),
    popupPage.goto(await getURL('popup.html')),
    contentPage.goto(getWebpageURL()),
  ]);

  await expect(optionsPage.evaluate(() => globalThis.__clientMessaging.request('options'))).resolves.toEqual({
    reply: 'background',
    data: 'options',
  });

  await expect(popupPage.evaluate(() => globalThis.__clientMessaging.requestTo('options', 'popup'))).resolves.toEqual({
    reply: 'options',
    data: 'popup',
  });

  const [webpage] = await popupPage.evaluate(() =>
    chrome.tabs.query({}).then(tabs =>
      tabs
        .filter(tab => tab.url?.startsWith('http'))
        .map(tab => ({
          id: tab.id,
          url: tab.url,
        }))
    )
  );

  await expect(
    popupPage.evaluate(tabId => globalThis.__clientMessaging.requestTo(tabId!, 'popup to content-script'), webpage.id)
  ).resolves.toEqual({
    reply: 'content-script',
    data: 'popup to content-script',
  });
});

test('Stream', async ({ context, getURL }) => {
  const optionsPage = await context.newPage();

  await optionsPage.goto(await getURL('options.html'));

  const result = await optionsPage.evaluate(() => {
    return new Promise<unknown[]>((resolve, reject) => {
      const result: unknown[] = [];
      globalThis.__clientMessaging.stream('options', {
        next: value => result.push(value),
        error: reject,
        complete: () => resolve(result),
      });
    });
  });

  expect(result).toEqual([1, 2, 3]);
});
