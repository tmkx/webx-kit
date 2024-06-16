import { execa, fs } from '@modern-js/utils';
import path from 'node:path';
import { describe, test, vi } from 'vitest';

vi.setConfig({
  testTimeout: 30 * 1000,
});

const tempDir = path.resolve(__dirname, '../node_modules/.cache');

const isCI = !!process.env.CI;

describe('Modern.js', () => {
  function build(dist: string, env?: string) {
    return execa('pnpm', ['modern', 'build'], {
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        DIST: dist,
        MODERN_ENV: env,
      },
    });
  }

  test.concurrent('Default', async ({ expect, onTestFinished }) => {
    const dist = path.resolve(tempDir, 'webx-modern-default');
    const compiler = build(dist);
    onTestFinished(() => void compiler.kill());
    await compiler;
    await expect(fs.readFile(path.resolve(dist, 'background.mjs'), 'utf8')).resolves.toContain(
      'https://httpbin.org/get?id=default'
    );
  });

  test.concurrent('Custom preset', async ({ expect, skip, onTestFinished }) => {
    if (isCI) skip(); // FIXME: the env mode is not correct in CI
    const dist = path.resolve(tempDir, 'webx-modern-custom');
    const compiler = build(dist, 'demo');
    onTestFinished(() => void compiler.kill());
    await compiler;
    await expect(fs.readFile(path.resolve(dist, 'background.mjs'), 'utf8')).resolves.toContain(
      'https://httpbin.org/get?id=demo'
    );
  });
});

describe('Rsbuild', () => {
  function build(dist: string, env?: string) {
    return execa('pnpm', ['rsbuild', 'build', ...(env ? ['--env-mode', env] : [])], {
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        DIST: dist,
      },
    });
  }

  test.concurrent('Default', async ({ expect, onTestFinished }) => {
    const dist = path.resolve(tempDir, 'webx-rsbuild-default');
    const compiler = build(dist);
    onTestFinished(() => void compiler.kill());
    await compiler;
    await expect(fs.readFile(path.resolve(dist, 'background.mjs'), 'utf8')).resolves.toContain(
      'https://httpbin.org/get?id=default'
    );
  });

  test.concurrent('Custom preset', async ({ expect, skip, onTestFinished }) => {
    if (isCI) skip(); // FIXME: the env mode is not correct in CI
    const dist = path.resolve(tempDir, 'webx-rsbuild-custom');
    const compiler = build(dist, 'demo');
    onTestFinished(() => void compiler.kill());
    await compiler;
    await expect(fs.readFile(path.resolve(dist, 'background.mjs'), 'utf8')).resolves.toContain(
      'https://httpbin.org/get?id=demo'
    );
  });
});
