import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { expect } from '@playwright/test';
import { isWindowsCI, startDev, test } from './webx-test';
import { gotoDevPage, setupStaticServer } from '@webx-kit/test-utils/playwright';

const { updateFile } = startDev(test);
const getWebpageURL = setupStaticServer(test);

declare namespace globalThis {
  let __secret: string;
}

declare global {
  interface Window {
    __secret: string;
  }
}

test('Background', async ({ background, context, extensionId }) => {
  const randomID = randomUUID();

  await background.evaluate(secret => (globalThis.__secret = secret), randomID);
  await expect(background.evaluate(() => globalThis.__secret)).resolves.toBe(randomID);

  const [newBackground] = await Promise.all([
    context.waitForEvent('serviceworker'),
    sleep(500).then(() => updateFile('src/background/index.ts', content => content.replace('hello', randomID))),
  ]);

  expect(newBackground.url().startsWith(`chrome-extension://${extensionId}`)).toBeTruthy();

  if (isWindowsCI) return;
  await expect
    .soft(background.evaluate(() => globalThis.__secret))
    .rejects.toThrowError('Target page, context or browser has been closed');
});

test('Options Page', async ({ getURL, page }) => {
  await gotoDevPage(page, await getURL('options.html'));
  await expect(page.locator('#root')).toHaveText('Options Page');

  const randomID = randomUUID();

  await page.evaluate(secret => (window.__secret = secret), randomID);
  await updateFile('src/pages/options/app.tsx', content => content.replace('Options Page', randomID));
  await expect(page.locator('#root')).toHaveText(randomID);

  // ensure the page is NOT refreshed
  const secret = await page.evaluate(() => window.__secret);
  expect(secret).toBe(randomID);
});

test('Content Scripts', async ({ page, background: _background }) => {
  await page.goto(getWebpageURL());

  await expect(page.locator('webx-root')).toBeInViewport();
  // await page.locator('body').screenshot({ path: './webx-root.png' });
  await expect(page.locator('webx-root')).toContainText('Count: 0');
  await page.locator('webx-root').locator('button').click();
  await expect(page.locator('webx-root')).toContainText('Count: 1');

  const randomID = randomUUID();
  await expect(page.locator('webx-root')).toContainText('Edit to Show HMR');
  await updateFile('src/content-scripts/hello.tsx', content => content.replace('Edit to Show HMR', randomID));
  await expect(page.locator('webx-root')).toContainText(randomID);

  await expect(page.locator('webx-root')).toContainText('Count: 1');
});
