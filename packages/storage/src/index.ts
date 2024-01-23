export interface ChromeStorage<T extends Record<string, any> = Record<string, any>> {
  setItem: <K extends keyof T>(key: K, value: T[K]) => Promise<void>;
  getItem: <K extends keyof T>(key: K, defaultValue?: T[K]) => Promise<T[K] | null>;
  hasItem: (key: string) => Promise<boolean>;
  getKeys: () => Promise<string[]>;
  removeItem: (key: keyof T | (keyof T)[]) => Promise<void>;
  clear: () => Promise<void>;
  subscribe: <K extends keyof T>(key: K, callback: (value: T[K] | null) => void) => VoidFunction;
  watch: (callback: (event: 'update' | 'remove', key: string) => void) => VoidFunction;
}

export function createStorage<T extends Record<string, any> = Record<string, any>>(
  area: chrome.storage.AreaName = 'local'
): ChromeStorage<T> {
  const storage = chrome.storage[area];

  async function setItem<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    return storage.set({ [key]: value });
  }

  async function getItem<K extends keyof T>(key: K, defaultValue?: T[K]): Promise<T[K] | null> {
    const result = await storage.get(key as string);
    return key in result ? result[key as string] : arguments.length === 2 ? defaultValue : null;
  }

  async function hasItem(key: string): Promise<boolean> {
    const result = await storage.get(key as string);
    return key in result;
  }

  async function getKeys(): Promise<string[]> {
    const result = await storage.get();
    return Object.keys(result);
  }

  async function removeItem(key: keyof T | (keyof T)[]): Promise<void> {
    return storage.remove(key as string | string[]);
  }

  async function clear(): Promise<void> {
    return storage.clear();
  }

  type OnChangedListener = Parameters<(typeof storage)['onChanged']['addListener']>[0];

  let onChangedActive = false;
  const onChangedCallbacks = new Map<keyof T, Set<(value: any) => void>>();
  const onChangedListener: OnChangedListener = (changes) => {
    for (const [key, value] of Object.entries(changes)) {
      const changedCallback = onChangedCallbacks.get(key);
      if (!changedCallback) continue;
      const newValue = 'newValue' in value ? value.newValue : null;
      changedCallback.forEach((callback) => callback(newValue));
    }
  };

  function addCallback(key: string, callback: (value: any) => void) {
    if (onChangedCallbacks.has(key)) onChangedCallbacks.get(key)!.add(callback);
    else onChangedCallbacks.set(key, new Set([callback]));
    if (!onChangedActive) {
      storage.onChanged.addListener(onChangedListener);
      onChangedActive = true;
    }
  }

  function removeCallback(key: string, callback: (value: any) => void) {
    const callbackSet = onChangedCallbacks.get(key);
    if (!callbackSet) return;
    callbackSet.delete(callback);
    if (!callbackSet.size) onChangedCallbacks.delete(key);
    if (!onChangedCallbacks.size) {
      storage.onChanged.removeListener(onChangedListener);
      onChangedActive = false;
    }
  }

  function subscribe<K extends keyof T>(key: K, callback: (value: T[K] | null) => void): VoidFunction {
    addCallback(key as string, callback);
    return () => {
      removeCallback(key as string, callback);
    };
  }

  function watch(callback: (type: 'update' | 'remove', key: string) => void): VoidFunction {
    const listener: OnChangedListener = (changes) => {
      for (const [key, value] of Object.entries(changes)) {
        const type = 'newValue' in value ? 'update' : 'remove';
        callback(type, key);
      }
    };
    storage.onChanged.addListener(listener);
    return () => {
      storage.onChanged.removeListener(listener);
    };
  }

  return {
    setItem,
    getItem,
    hasItem,
    getKeys,
    removeItem,
    clear,
    subscribe,
    watch,
  };
}
