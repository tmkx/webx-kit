import { expect, test } from './context';

test('Single page', async ({ getURL, page }) => {
  await page.goto(await getURL('unstorage.html'));

  await expect(page.getByTestId('apiKey')).toHaveText('DEFAULT');
  await page.getByTestId('change').click();
  await expect(page.getByTestId('apiKey')).toHaveText('Changed');

  await page.reload();
  await expect(page.getByTestId('apiKey')).toHaveText('Changed');
});

test('Cross pages', async ({ getURL, context }) => {
  const jotaiPage = await context.newPage();
  const jotai2Page = await context.newPage();

  await jotaiPage.goto(await getURL('unstorage.html'));
  await jotai2Page.goto(await getURL('unstorage-2.html'));

  await expect(jotaiPage.getByTestId('apiKey')).toHaveText('DEFAULT');
  await expect(jotai2Page.getByTestId('apiKey')).toHaveText('DEFAULT');

  await jotaiPage.getByTestId('change').click();
  await expect(jotaiPage.getByTestId('apiKey')).toHaveText('Changed');
  await expect(jotai2Page.getByTestId('apiKey')).toHaveText('Changed');

  await Promise.all([jotaiPage.reload(), jotai2Page.reload()]);
  await expect(jotaiPage.getByTestId('apiKey')).toHaveText('Changed');
  await expect(jotai2Page.getByTestId('apiKey')).toHaveText('Changed');
});
