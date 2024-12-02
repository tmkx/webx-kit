/**
 * @see {@link https://playwright.dev/docs/chrome-extensions Chrome extensions | Playwright}
 */
import { defineConfig } from '@playwright/test';
import { createLaunchOptions } from './tests/webx-test';

export default defineConfig({
  testDir: './tests',
  retries: 2,
  ...(process.platform === 'win32'
    ? {
        // HMR is slow in Windows sometimes
        expect: { timeout: 15000 },
      }
    : null),

  projects: [
    {
      name: 'React',
      grep: /react\.spec/,
      use: {
        launchOptions: createLaunchOptions('@webx-kit/template-react'),
      },
    },
    {
      name: 'ReactWebpack',
      grep: /react-webpack/,
      use: {
        launchOptions: createLaunchOptions('@webx-kit/template-react-webpack'),
      },
    },
    {
      name: 'Solid',
      grep: /solid/,
      use: {
        launchOptions: createLaunchOptions('@webx-kit/template-solid'),
      },
    },
    {
      name: 'Svelte',
      grep: /svelte/,
      use: {
        launchOptions: createLaunchOptions('@webx-kit/template-svelte'),
      },
    },
    {
      name: 'Vue',
      grep: /vue/,
      use: {
        launchOptions: createLaunchOptions('@webx-kit/template-vue'),
      },
    },
  ],
});
