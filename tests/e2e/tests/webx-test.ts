import assert from 'node:assert';
import path from 'node:path';
import { dynamicImport, fs, execa, stripAnsi } from '@modern-js/utils';
import { createWebxTest, getRandomPort } from '@webx-kit/test-utils/playwright';
import { LaunchOptions } from '@playwright/test';

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
    const { stdout: packagesInfoJson } = await execa('pnpm', ['list', '--filter', packageName, '--depth=-1', '--json']);
    const packagesInfo = JSON.parse(packagesInfoJson) as { name: string; path: string }[];
    if (packagesInfo.length === 0) throw new Error(`Cannot find ${packageName}`);
    return use(packagesInfo[0].path);
  },
  extensionPath: async ({ packageDir }, use) => use(path.resolve(packageDir, DEV_DIST_DIR)),
});

export const expect = test.expect;

export function startDev({ beforeAll, afterAll, afterEach }: typeof test) {
  let baseDir: string;
  let childProcess: execa.ExecaChildProcess<string>;

  beforeAll(async ({ packageDir }, testInfo) => {
    testInfo.setTimeout(30 * 1000);
    baseDir = packageDir;
    const { stdout: dirtyFiles } = await execa('git', ['ls-files', '--modified'], { cwd: packageDir });
    if (!!dirtyFiles) throw new Error('Make sure all modifications have been staged');
    const PORT = String(await getRandomPort());
    childProcess = execa('pnpm', ['dev'], {
      cwd: packageDir,
      env: { PORT, WEBX_DIST: DEV_DIST_DIR },
    });
    await Promise.race([
      new Promise<void>((resolve) => {
        const handler = (chunk: unknown) => {
          const message = stripAnsi(String(chunk));
          !process.env.CI && message && console.log(message);
          if (message.includes('Client compiled in')) {
            childProcess.stdout?.removeListener('data', handler);
            resolve();
          }
        };
        childProcess.stdout?.addListener('data', handler);
      }),
      childProcess.catch((reason): Promise<void> => Promise.reject(reason.message)),
    ]);
  });
  afterEach(async () => {
    const { default: pRetry } = (await dynamicImport('p-retry')) as typeof import('p-retry');
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
