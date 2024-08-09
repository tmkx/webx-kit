import { randomUUID } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { expect } from '@playwright/test';
import { WebSocket } from 'ws';
import { startDev, test } from './webx-test';
import { gotoDevPage, setupStaticServer } from '@webx-kit/test-utils/playwright';

const { updateFile, getPort } = startDev(test);
const getWebpageURL = setupStaticServer(test);

declare module globalThis {
  let __secret: string;
}

declare global {
  interface Window {
    __secret: string;
  }
}

test('Background', async ({ background, context, extensionId, packageName }) => {
  const randomID = randomUUID();

  const port = getPort()!;

  const ws = new WebSocket(`ws://localhost:${port}/rsbuild-hmr?compilationName=web_${encodeURIComponent(packageName)}`);

  let prevId = '';
  ws.addEventListener('message', async (ev) => {
    const data = JSON.parse(String(ev.data));
    console.log('===> HMR Message', data);
    if (data.type !== 'hash') return;
    const id = prevId;
    prevId = data.data;
    if (!id) return;
    const code = await fetch(`http://localhost:${port}/background.${id}.hot-update.js`).then((res) => res.text());
    let updatedModules: string[] = [];
    const mod = {
      webpackHotUpdate_webx_kit_example_react: (moduleId: string, chunks: Record<string, Function>) => {
        updatedModules = Object.keys(chunks);
        updatedModules.unshift(moduleId);
      },
    };
    runInNewContext(code, { self: mod });
    console.log({ updatedModules });
  });

  await background.evaluate((secret) => (globalThis.__secret = secret), randomID);
  await expect(background.evaluate(() => globalThis.__secret)).resolves.toBe(randomID);

  // @ts-expect-error
  const origBackgroundGuid = background._guid;
  const workers = context.serviceWorkers();
  console.log(
    'INIT',
    { origBackgroundGuid },
    // @ts-expect-error 123
    workers.map((worker) => worker._guid)
  );

  // await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

  const [newBackground] = await Promise.all([
    context.waitForEvent('serviceworker'),
    updateFile('src/background/index.ts', (content) => content.replace('hello', randomID)),
    new Promise<void>(async (resolve) => {
      const start = Date.now();
      let count = 0;
      while (Date.now() - start < 25 * 1000) {
        const workers = context.serviceWorkers();
        // @ts-expect-error 123
        const newWorkers = workers.map((worker) => worker._guid);
        console.log(newWorkers);
        if (newWorkers.some((worker) => worker !== origBackgroundGuid)) break;
        if (count >= 2) {
          await background.evaluate(() => chrome.runtime.reload());
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      resolve();
    }),
  ]);

  // await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000));

  expect(newBackground.url().startsWith(`chrome-extension://${extensionId}`)).toBeTruthy();
  await expect(background.evaluate(() => globalThis.__secret)).rejects.toThrowError(
    'Target page, context or browser has been closed'
  );

  await ws.close();
});

test('Options Page', async ({ getURL, page }) => {
  await gotoDevPage(page, await getURL('options.html'));
  await expect(page.locator('#root')).toHaveText('Options Page');

  const randomID = randomUUID();

  await page.evaluate((secret) => (window.__secret = secret), randomID);
  await updateFile('src/pages/options/app.tsx', (content) => content.replace('Options Page', randomID));
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
  await updateFile('src/content-scripts/hello.tsx', (content) => content.replace('Edit to Show HMR', randomID));
  await expect(page.locator('webx-root')).toContainText(randomID);

  await expect(page.locator('webx-root')).toContainText('Count: 1');
});
