import assert from 'node:assert';
import path from 'node:path';
import { fs, execa, stripAnsi, wait } from '@modern-js/utils';
import { createWebxTest } from '@webx-kit/test-utils/playwright';
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
  extensionPath: async ({ packageDir }, use) => use(path.join(packageDir, 'dist')),
});

export const expect = test.expect;

export function startDev({ beforeAll, afterAll, afterEach }: typeof test) {
  let baseDir: string;
  let childProcess: execa.ExecaChildProcess<string>;

  beforeAll(async ({ packageDir }) => {
    baseDir = packageDir;
    const { stdout: dirtyFiles } = await execa('git', ['ls-files', '--modified'], { cwd: packageDir });
    if (!!dirtyFiles) throw new Error('make sure all modifications have been staged');
    childProcess = execa('pnpm', ['dev'], { cwd: packageDir });
    await Promise.race([
      new Promise<void>((resolve) => {
        const handler = (chunk: unknown) => {
          const message = stripAnsi(String(chunk));
          !process.env.CI && console.log(message);
          if (message.includes('client-side renders as static HTML')) {
            childProcess.stdout?.removeListener('data', handler);
            resolve();
          }
        };
        childProcess.stdout?.addListener('data', handler);
      }),
      wait(20 * 1000).then((): Promise<void> => Promise.reject('Timeout')),
    ]);
  });
  afterEach(() => execa('git', ['checkout', '.'], { cwd: baseDir }));
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
