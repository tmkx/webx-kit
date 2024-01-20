import { setupStaticServer } from '@webx-kit/test-utils/playwright';
import { expect, test } from './webx-test';

const getWebpageURL = setupStaticServer(test);

test('Options Page', async ({ getURL, page }) => {
  await page.goto(await getURL('options.html'));
  await expect(page.locator('#root')).toHaveText('Options Page');
});

test('Popup Page', async ({ getURL, page }) => {
  await page.goto(await getURL('popup.html'));
  await expect(page.locator('#root')).toHaveText('Popup Page');
});

test('Content Scripts', async ({ page }) => {
  await page.goto(getWebpageURL());
  await expect(page.locator('webx-root')).toBeInViewport();
  // await page.locator('body').screenshot({ path: './webx-root.png' });
  await expect(page.locator('webx-root').evaluate((el) => el.shadowRoot?.textContent?.trim())).resolves.toBe(
    'Count: 0'
  );
  await page.locator('webx-root').locator('button').click();
  await expect(page.locator('webx-root').evaluate((el) => el.shadowRoot?.textContent?.trim())).resolves.toBe(
    'Count: 1'
  );
});
