/**
 * @see {@link https://playwright.dev/docs/chrome-extensions Chrome extensions | Playwright}
 */
import { defineConfig, devices } from '@playwright/test';
import { createLaunchOptions } from './tests/webx-test';

export default defineConfig({
  testDir: './tests',
  retries: 2,
  ...(process.platform === 'win32'
    ? {
        // HMR is slow in Windows sometimes
        expect: { timeout: 15000 },
        workers: 1,
      }
    : null),

  projects: [
    {
      name: 'React',
      grep: /react\.spec/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        launchOptions: createLaunchOptions('@webx-kit/template-react'),
      },
    },
    {
      name: 'Solid',
      grep: /solid/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        launchOptions: createLaunchOptions('@webx-kit/template-solid'),
      },
    },
    {
      name: 'Svelte',
      grep: /svelte/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        launchOptions: createLaunchOptions('@webx-kit/template-svelte'),
      },
    },
    {
      name: 'Vue',
      grep: /vue/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        launchOptions: createLaunchOptions('@webx-kit/template-vue'),
      },
    },
  ],
});
