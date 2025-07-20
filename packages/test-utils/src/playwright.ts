/// <reference types="@webx-kit/chrome-types" />
import path from 'node:path';
import { type BrowserType, type Page, type TestType, type Worker, test as base, chromium } from '@playwright/test';
import { type CreateStaticServerOptions, createStaticServer, sleep } from './shared';

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
  const cachedExtensionIdMap = new Map<string, string>();

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
      let hasRuntime = false;
      for (let retryTimes = 5; retryTimes > 0; --retryTimes) {
        hasRuntime = await background.evaluate(() => 'runtime' in chrome);
        if (hasRuntime) break;
        await sleep(200);
      }

      if (!hasRuntime) {
        const keys = await background.evaluate(() => Object.keys(chrome));
        throw new Error(`Cannot find runtime in chrome: ${keys}, ${background.url()}`);
      }

      return use(background);
    },
    extensionId: async ({ context, extensionPath }, use) => {
      if (cachedExtensionIdMap.has(extensionPath)) return use(cachedExtensionIdMap.get(extensionPath)!);
      const page = await context.newPage();
      await page.goto('chrome://extensions');
      const extensionId = await page.evaluate(
        (extPath) =>
          chrome.developerPrivate
            .getExtensionsInfo()
            .then((extensions) => extensions.find((ext) => ext.path === extPath)?.id),
        extensionPath
      );
      await page.close();
      if (!extensionId) throw new Error('Cannot get extension id');
      cachedExtensionIdMap.set(extensionPath, extensionId);
      return use(extensionId);
    },
    getURL: ({ extensionId }, use) => use(async (p) => `chrome-extension://${extensionId}${path.posix.join('/', p)}`),
  });

  return webxTest;
}

export function setupStaticServer(test: TestType<any, any>, serverOptions?: CreateStaticServerOptions) {
  let server: Awaited<ReturnType<typeof createStaticServer>> | undefined;

  test.beforeAll(async () => (server = await createStaticServer(serverOptions)));
  test.afterAll(() => server?.close());

  return () => server?.getURL() || 'about:blank';
}

export async function gotoDevPage(page: Page, ...args: Parameters<Page['goto']>) {
  return (await Promise.all([page.goto(...args), page.waitForEvent('websocket').catch(() => {})]))[0];
}
