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
});

test('Cross pages', async ({ getURL, context }) => {
  const jotaiPage = await context.newPage();
  const optionsPage = await context.newPage();
  const webPage = await context.newPage();

  await jotaiPage.goto(await getURL('jotai.html'));
  await optionsPage.goto(await getURL('options.html'));
  await webPage.goto(getWebpageURL());

  await expect(jotaiPage.getByTestId('apiKey')).toHaveText('DEFAULT');
  await expect(optionsPage.getByTestId('apiKey')).toHaveText('DEFAULT');
  await expect(webPage.getByTestId('apiKey')).toHaveText('DEFAULT');

  await jotaiPage.getByTestId('change').click();
  await expect(jotaiPage.getByTestId('apiKey')).toHaveText('Changed');
  await expect(optionsPage.getByTestId('apiKey')).toHaveText('Changed');
  await expect(webPage.getByTestId('apiKey')).toHaveText('Changed');

  await Promise.all([jotaiPage.reload(), optionsPage.reload(), webPage.reload()]);
  await expect(jotaiPage.getByTestId('apiKey')).toHaveText('Changed');
  await expect(optionsPage.getByTestId('apiKey')).toHaveText('Changed');
  await expect(webPage.getByTestId('apiKey')).toHaveText('Changed');
});
