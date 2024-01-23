import { ChromeStorage, createStorage } from './index';

export function createDriver(): ChromeStorage {
  const storage = createStorage();
  return {
    ...storage,
    getItem: (key: string) => storage.getItem(key),
  };
}
