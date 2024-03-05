import { setupStaticServer } from '@webx-kit/test-utils/playwright';
import { expect, test } from './context';

const getWebpageURL = setupStaticServer(test);

test('Single page', async ({ getURL, page }) => {
  await page.goto(await getURL('jotai.html'));

  await expect(page.getByTestId('apiKey')).toHaveText('DEFAULT');
  await page.getByTestId('change').click();
  await expect(page.getByTestId('apiKey')).toHaveText('Changed');

  await page.reload();
  await expect(page.getByTestId('apiKey')).toHaveText('Changed');

  await expect(page.evaluate(() => chrome.storage.local.get())).resolves.toEqual({
    'jotai:apiKey': 'Changed',
  });
});

test('Cross pages', async ({ getURL, context }) => {
  const jotaiPage = await context.newPage();
  const jotai2Page = await context.newPage();
  const webPage = await context.newPage();

  await jotaiPage.goto(await getURL('jotai.html'));
  await jotai2Page.goto(await getURL('jotai-2.html'));
  await webPage.goto(getWebpageURL());

  await expect(jotaiPage.getByTestId('apiKey')).toHaveText('DEFAULT');
  await expect(jotai2Page.getByTestId('apiKey')).toHaveText('DEFAULT');
  await expect(webPage.getByTestId('apiKey')).toHaveText('DEFAULT');

  await jotaiPage.getByTestId('change').click();
  await expect(jotaiPage.getByTestId('apiKey')).toHaveText('Changed');
  await expect(jotai2Page.getByTestId('apiKey')).toHaveText('Changed');
  await expect(webPage.getByTestId('apiKey')).toHaveText('Changed');

  await Promise.all([jotaiPage.reload(), jotai2Page.reload(), webPage.reload()]);
  await expect(jotaiPage.getByTestId('apiKey')).toHaveText('Changed');
  await expect(jotai2Page.getByTestId('apiKey')).toHaveText('Changed');
  await expect(webPage.getByTestId('apiKey')).toHaveText('Changed');
});

test('Clear', async ({ getURL, page }) => {
  await page.goto(await getURL('jotai-clear.html'));

  await expect(page.getByTestId('apiKey')).toHaveText('DEFAULT');
  await page.getByTestId('change').click();
  await expect(page.getByTestId('apiKey')).toHaveText('Changed');
  await page.getByTestId('clear').click();
  await expect(page.getByTestId('apiKey')).toHaveText('DEFAULT');
});
