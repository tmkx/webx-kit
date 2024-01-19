import { expect, test } from './context';
import { ChromeStorage } from '@/index';

declare module globalThis {
  const __storage: ChromeStorage;
}

test('Set Item', async ({ background }) => {
  await expect(background.evaluate(() => typeof globalThis.__storage)).resolves.toBe('object');

  await expect(background.evaluate(() => globalThis.__storage.getItem('A'))).resolves.toBeNull();
  await background.evaluate(() => globalThis.__storage.setItem('A', 'OK'));
  await expect(background.evaluate(() => globalThis.__storage.getItem('A'))).resolves.toBe('OK');
});

test('Remove Item', async ({ background }) => {
  await background.evaluate(() => globalThis.__storage.setItem('A', 'OK'));
  await expect(background.evaluate(() => globalThis.__storage.getItem('A'))).resolves.toBe('OK');
  await background.evaluate(() => globalThis.__storage.removeItem('A'));
  await expect(background.evaluate(() => globalThis.__storage.getItem('A'))).resolves.toBeNull();
});

test('Clear', async ({ background }) => {
  await background.evaluate(() => globalThis.__storage.setItem('A', 'OK'));
  await background.evaluate(() => globalThis.__storage.setItem('B', 'OK'));
  await expect(background.evaluate(() => globalThis.__storage.getItem('A'))).resolves.toBe('OK');
  await expect(background.evaluate(() => globalThis.__storage.getItem('B'))).resolves.toBe('OK');
  await background.evaluate(() => globalThis.__storage.clear());
  await expect(background.evaluate(() => globalThis.__storage.getItem('A'))).resolves.toBeNull();
  await expect(background.evaluate(() => globalThis.__storage.getItem('B'))).resolves.toBeNull();
});
