/**
 * @see {@link https://playwright.dev/docs/chrome-extensions Chrome extensions | Playwright}
 */
import { defineConfig } from '@playwright/test';
import { createLaunchOptions } from './tests/webx-test';

export default defineConfig({
  testDir: './tests',
  retries: 2,
  projects: [
    {
      name: 'React',
      grep: /react/,
      use: {
        launchOptions: createLaunchOptions('@webx-kit/example-react'),
      },
    },
    {
      name: 'Solid',
      grep: /solid/,
      use: {
        launchOptions: createLaunchOptions('@webx-kit/example-solid'),
      },
    },
    {
      name: 'Vue',
      grep: /vue/,
      use: {
        launchOptions: createLaunchOptions('@webx-kit/example-vue'),
      },
    },
  ],
});
