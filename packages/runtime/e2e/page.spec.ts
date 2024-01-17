import { expect, test } from '@playwright/test';
import { isPageInDark } from '../src/content-scripts';

test.describe('isPageInDark', () => {
  test('example.com / always light', async ({ page }) => {
    await page.goto('https://example.com/');
    await expect(page.evaluate(isPageInDark)).resolves.toBeFalsy();

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.evaluate(isPageInDark)).resolves.toBeFalsy();
  });

  test('GitHub Docs / follow system', async ({ page }) => {
    await page.goto('https://docs.github.com/');
    await expect(page.evaluate(isPageInDark)).resolves.toBeFalsy();

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.evaluate(isPageInDark)).resolves.toBeTruthy();
  });
});
