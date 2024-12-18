import { setupStaticServer } from '@webx-kit/test-utils/playwright';
import { expect, test } from './context';

const getWebpageURL = setupStaticServer(test);

test('Popup Page', async ({ getURL, page }) => {
  await page.goto(await getURL('popup.html'));

  await page.locator('button', { hasText: 'Account' }).click();
  await expect(page.getByRole('tabpanel')).toHaveText('Make changes to your account here.');

  await page.locator('button', { hasText: 'Password' }).click();
  await expect(page.getByRole('tabpanel')).toHaveText('Change your password here.');
});

test('Content Scripts', async ({ page }) => {
  await page.goto(getWebpageURL());
  await page.getByTestId('settings').click();
  await expect(page.getByTestId('title')).toContainText('Move Goal');
});
