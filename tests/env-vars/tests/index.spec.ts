import { execa, fs } from '@modern-js/utils';
import { loadEnv } from '@rsbuild/core';
import path from 'node:path';
import { describe, test, vi } from 'vitest';

vi.setConfig({
  testTimeout: 60 * 1000,
});

const tempDir = path.resolve(__dirname, '../node_modules/.cache');

describe('Modern.js', () => {
  function build(dist: string, env?: string) {
    loadEnv({ mode: env }).cleanup(); // NX will automatically load the .env file
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

  test.concurrent('Custom preset', async ({ expect, onTestFinished }) => {
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
    loadEnv({ mode: env }).cleanup(); // NX will automatically load the .env file
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

  test.concurrent('Custom preset', async ({ expect, onTestFinished }) => {
    const dist = path.resolve(tempDir, 'webx-rsbuild-custom');
    const compiler = build(dist, 'demo');
    onTestFinished(() => void compiler.kill());
    await compiler;
    await expect(fs.readFile(path.resolve(dist, 'background.mjs'), 'utf8')).resolves.toContain(
      'https://httpbin.org/get?id=demo'
    );
  });
});
