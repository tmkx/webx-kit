import assert from 'node:assert';
import path from 'node:path';
import { execa } from '@modern-js/utils';
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
