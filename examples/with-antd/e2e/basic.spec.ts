import { setupStaticServer } from '@webx-kit/test-utils/playwright';
import { expect, test } from './context';

const getWebpageURL = setupStaticServer(test);

test('Popup Page', async ({ getURL, page }) => {
  await page.goto(await getURL('popup.html'));
  for (let id = 1; id <= 2; id++) {
    await page.getByTestId(`tab-${id}`).click();
    await expect(page.getByTestId(`content-${id}`)).toBeVisible();
  }
});

test('Content Scripts', async ({ page }) => {
  await page.goto(getWebpageURL());
  await page.getByRole('button').click();
  await expect(page.getByTestId('settings')).toContainText('Content');
});
