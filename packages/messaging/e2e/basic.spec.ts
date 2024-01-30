import { setupStaticServer } from '@webx-kit/test-utils/playwright';
import { expect, test } from './context';
import type { Messaging } from '@/core';
import type { WrappedMessaging } from '@/client-base';

const getWebpageURL = setupStaticServer(test);

declare module globalThis {
  /** only in background */
  const __webxConnections: Set<Messaging> | undefined;
  const __client: WrappedMessaging;
}

test('Background', async ({ background }) => {
  await expect(background.evaluate(() => typeof globalThis.__webxConnections)).resolves.toBe('object');
});

test('Messaging', async ({ context, getURL }) => {
  const optionsPage = await context.newPage();
  const popupPage = await context.newPage();
  const contentScript = await context.newPage();

  await Promise.all([
    optionsPage.goto(await getURL('options.html')),
    popupPage.goto(await getURL('popup.html')),
    contentScript.goto(getWebpageURL()),
  ]);

  await expect(optionsPage.evaluate(() => globalThis.__client.request('options', 'popup'))).resolves.toEqual({
    reply: 'popup',
    data: 'options',
  });

  await expect(popupPage.evaluate(() => globalThis.__client.request('popup', 'options'))).resolves.toEqual({
    reply: 'options',
    data: 'popup',
  });

  await expect(
    popupPage.evaluate(() => globalThis.__client.request('popup to content-script', 'content-script'))
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
      globalThis.__client.stream('options', {
        next: (value) => result.push(value),
        error: reject,
        complete: () => resolve(result),
      });
    });
  });

  expect(result).toEqual([1, 2, 3]);
});
