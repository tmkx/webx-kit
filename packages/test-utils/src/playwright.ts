/// <reference types="@webx-kit/chrome-types" />
import { BrowserType, Page, TestType, Worker, test as base, chromium } from '@playwright/test';
import { CreateStaticServerOptions, createStaticServer, sleep } from './shared';

export * from './shared';

export interface WebXTestFixtures {
  extensionPath: string;
  background: Worker;
  extensionId: string;
  getURL: (path: string) => Promise<string>;
}

export interface CreateWebxTestOptions {
  extensionPath: string;
  browser?: BrowserType;
}

export function createWebxTest({ extensionPath, browser = chromium }: CreateWebxTestOptions) {
  const webxTest = base.extend<WebXTestFixtures>({
    extensionPath: async ({}, use) => use(extensionPath),
    context: async ({ headless, launchOptions, extensionPath }, use) => {
      if (!extensionPath) throw new Error('`extensionPath` is not defined');
      const context = await browser.launchPersistentContext('', {
        ...launchOptions,
        args: [
          ...(launchOptions.args || []),
          ...(headless ? ['--headless=new'] : []),
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
        ],
      });
      await use(context);
    },
    background: async ({ context }, use) => {
      let [background] = context.serviceWorkers();
      if (!background) background = await context.waitForEvent('serviceworker');

      // wait for service worker to be ready
      for (let retryTimes = 5; retryTimes > 0; --retryTimes) {
        const hasRuntime = await background.evaluate(() => 'runtime' in chrome);
        if (hasRuntime) break;
        await sleep(200);
      }

      return use(background);
    },
    extensionId: async ({ background }, use) => use(await background.evaluate(() => chrome.runtime.id)),
    getURL: async ({ background }, use) => use((path) => background.evaluate((p) => chrome.runtime.getURL(p), path)),
  });

  return webxTest;
}

export function setupStaticServer(test: TestType<any, any>, serverOptions?: CreateStaticServerOptions) {
  let result: Awaited<ReturnType<typeof createStaticServer>> | undefined;

  test.beforeAll(async () => (result = await createStaticServer(serverOptions)));
  test.afterAll(() => result?.close());

  return () => result?.getURL() || 'about:blank';
}

export async function gotoDevPage(page: Page, ...args: Parameters<Page['goto']>) {
  return (await Promise.all([page.goto(...args), page.waitForEvent('websocket').catch(() => {})]))[0];
}
