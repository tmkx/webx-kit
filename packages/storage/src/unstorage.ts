import { ChromeStorage, CreateStorageOptions, createStorage } from './index';

export function createDriver(options?: CreateStorageOptions): ChromeStorage {
  const storage = createStorage(options);
  return {
    ...storage,
    getItem: (key: string) => storage.getItem(key),
  };
}
