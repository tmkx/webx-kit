import { expect, setupStaticServer, test } from './context';

const getWebpageURL = setupStaticServer();

test('Background', async ({ page, background }) => {
  const consoleLogs: string[] = [];
  page.on('console', (message) => consoleLogs.push(message.text()));
  await expect(background.evaluate(() => typeof chrome.runtime.reload)).resolves.toBe('function');
});

test('Options', async ({ page, getURL }) => {
  const consoleLogs: string[] = [];
  page.on('console', (message) => consoleLogs.push(message.text()));
  await page.goto(await getURL('options.html'));
  expect(consoleLogs).toContain('isBackground false');
});

test('Popup', async ({ page, getURL }) => {
  const consoleLogs: string[] = [];
  page.on('console', (message) => consoleLogs.push(message.text()));
  await page.goto(await getURL('popup.html'));
  expect(consoleLogs).toContain('isBackground false');
});

test('Content Scripts', async ({ page }) => {
  const consoleLogs: string[] = [];
  page.on('console', (message) => consoleLogs.push(message.text()));
  await page.goto(getWebpageURL());
  expect(consoleLogs).toContain('isBackground false');
});
