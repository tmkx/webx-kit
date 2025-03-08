import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createWebxTest, getRandomPort } from '@webx-kit/test-utils/playwright';
import type { LaunchOptions } from '@playwright/test';
import type { ResultPromise } from 'execa';

export function createLaunchOptions(packageName: string, launchOptions?: LaunchOptions) {
  return { ...launchOptions, packageName };
}

function getPackageNameFromLaunchOptions(launchOptions: LaunchOptions): string {
  // @ts-expect-error
  const packageName = launchOptions.packageName;
  assert(typeof packageName === 'string');
  return packageName;
}

const webxTest = createWebxTest({
  extensionPath: 'UNKNOWN',
});

const DEV_DIST_DIR = 'node_modules/.cache/dev-dist';

export const test = webxTest.extend<{
  packageName: string;
  packageDir: string;
}>({
  packageName: ({ launchOptions }, use) => use(getPackageNameFromLaunchOptions(launchOptions)),
  packageDir: async ({ packageName }, use) => {
    const { execa } = await import('execa');
    const { stdout: packagesInfoJson } = await execa('pnpm', ['list', '--filter', packageName, '--depth=-1', '--json']);
    const packagesInfo = JSON.parse(packagesInfoJson) as { name: string; path: string }[];
    if (packagesInfo.length === 0) throw new Error(`Cannot find ${packageName}`);
    return use(packagesInfo[0].path);
  },
  extensionPath: async ({ packageDir }, use) => use(path.resolve(packageDir, DEV_DIST_DIR)),
});

export const expect = test.expect;

export function startDev({ beforeAll, afterAll, beforeEach, afterEach }: typeof test) {
  let baseDir: string;
  let childProcess: ResultPromise<{}>;

  beforeAll(async ({ packageDir }, testInfo) => {
    testInfo.setTimeout(30 * 1000);
    baseDir = packageDir;
    const { execa } = await import('execa');
    const { stdout: dirtyFiles } = await execa('git', ['ls-files', '--modified'], { cwd: packageDir });
    if (!!dirtyFiles) throw new Error(`Make sure all modifications have been staged:\n${dirtyFiles}`);
    const PORT = String(await getRandomPort());
    childProcess = execa('pnpm', ['dev'], {
      cwd: packageDir,
      env: { PORT, WEBX_DIST: DEV_DIST_DIR },
    });
    const { default: stripAnsi } = await import('strip-ansi');
    await Promise.race([
      new Promise<void>((resolve) => {
        const handler = (chunk: unknown) => {
          const message = stripAnsi(String(chunk));
          !process.env.CI && message && console.log(message.trim());
          if (message.startsWith('ready')) {
            childProcess.stdout?.removeListener('data', handler);
            resolve();
          }
        };
        childProcess.stdout?.addListener('data', handler);
      }),
      childProcess.catch((reason): Promise<void> => Promise.reject(reason.message)),
    ]);
  });
  beforeEach(async ({ context }, { title }) => {
    if (title !== 'Background') return;
    const page = await context.newPage();
    await page.goto('chrome://extensions/');
    await page.evaluate(async () => {
      // "Turn on developer mode to use this extension, which can't be reviewed by the Chrome Web Store."
      await chrome.developerPrivate.updateProfileConfiguration({ inDeveloperMode: true });
      const extensions = await chrome.developerPrivate.getExtensionsInfo();
      for (const extension of extensions) {
        for (const view of extension.views.filter(
          (view) => view.type === chrome.developerPrivate.ViewType.EXTENSION_SERVICE_WORKER_BACKGROUND
        )) {
          // keep background alive
          await chrome.developerPrivate.openDevTools({
            extensionId: extension.id,
            incognito: view.incognito,
            renderProcessId: view.renderProcessId,
            renderViewId: view.renderViewId,
            isServiceWorker: true,
          });
        }
      }
    });
    await page.close();
  });
  afterEach(async () => {
    const { execa } = await import('execa');
    const { default: pRetry } = await import('p-retry');
    // tolerate `.git/index.lock` conflict
    await pRetry(() => execa('git', ['checkout', '.'], { cwd: baseDir }), { retries: 3 });
  });
  afterAll(() => childProcess.kill('SIGINT'));

  const resolvePath = (file: string) => path.resolve(baseDir, file);

  return {
    getBaseDir: () => baseDir,
    async updateFile(file: string, updater: (content: string) => string) {
      const content = await fs.readFile(resolvePath(file), 'utf8');
      await fs.writeFile(resolvePath(file), updater(content));
    },
  };
}
