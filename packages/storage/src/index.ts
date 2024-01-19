export interface ChromeStorage<T extends Record<string, any> = Record<string, any>> {
  setItem: <K extends keyof T>(key: K, value: T[K]) => Promise<void>;
  getItem: <K extends keyof T>(key: K) => Promise<T[K] | null>;
  removeItem: (key: keyof T | (keyof T)[]) => Promise<void>;
  clear: () => Promise<void>;
}

export function createStorage<T extends Record<string, any> = Record<string, any>>(
  area: chrome.storage.AreaName = 'local'
): ChromeStorage<T> {
  const storage = chrome.storage[area];

  async function setItem<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    return storage.set({ [key]: value });
  }

  async function getItem<K extends keyof T>(key: K): Promise<T[K] | null> {
    const result = await storage.get(key as string);
    return result[key as string] ?? null;
  }

  async function removeItem(key: keyof T | (keyof T)[]): Promise<void> {
    return storage.remove(key as string | string[]);
  }

  async function clear(): Promise<void> {
    return storage.clear();
  }

  return {
    setItem,
    getItem,
    removeItem,
    clear,
  };
}
