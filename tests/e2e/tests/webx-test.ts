/// <reference types="@webx-kit/chrome-types" />

import assert from 'node:assert';
import { createServer } from 'node:http';
import path from 'node:path';
import { execa, wait } from '@modern-js/utils';
import { Worker, test as base, chromium, LaunchOptions } from '@playwright/test';

export function createLaunchOptions(packageName: string, launchOptions?: LaunchOptions) {
  return { ...launchOptions, packageName };
}

function getPackageNameFromLaunchOptions(launchOptions: LaunchOptions): string {
  // @ts-expect-error
  const packageName = launchOptions.packageName;
  assert(typeof packageName === 'string');
  return packageName;
}

export const test = base.extend<{
  packageName: string;
  packageDir: string;
  background: Worker;
  extensionId: string;
  getURL: (path: string) => Promise<string>;
}>({
  packageName: ({ launchOptions }, use) => use(getPackageNameFromLaunchOptions(launchOptions)),
  packageDir: async ({ packageName }, use) => {
    const { stdout: packagesInfoJson } = await execa('pnpm', ['list', '--filter', packageName, '--depth=-1', '--json']);
    const packagesInfo = JSON.parse(packagesInfoJson) as { name: string; path: string }[];
    if (packagesInfo.length === 0) throw new Error(`Cannot find ${packageName}`);
    return use(packagesInfo[0].path);
  },
  context: async ({ headless, packageDir, launchOptions }, use) => {
    const extensionPath = path.join(packageDir, 'dist');
    const context = await chromium.launchPersistentContext('', {
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
      await wait(200);
    }

    return use(background);
  },
  extensionId: async ({ background }, use) => use(await background.evaluate(() => chrome.runtime.id)),
  getURL: async ({ background }, use) => use((path) => background.evaluate((p) => chrome.runtime.getURL(p), path)),
});

export const expect = test.expect;

async function createStaticServer() {
  const server = createServer((_req, res) => {
    res.end(`<html></html>`);
  });
  server.listen(0);
  server.address();
  return { server, close: () => server.close() };
}

export function setupStaticServer() {
  let result: Awaited<ReturnType<typeof createStaticServer>> | undefined;

  test.beforeAll(async () => (result = await createStaticServer()));
  test.afterAll(() => result?.close());

  return () => {
    const address = result?.server.address();
    return typeof address === 'string' ? address : `http://127.0.0.1:${address?.port}/`;
  };
}
