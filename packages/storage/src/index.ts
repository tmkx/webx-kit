import type { StringKeyOf } from 'type-fest';

export interface ChromeStorage<T extends Record<string, any> = Record<string, any>> {
  setItem: <K extends StringKeyOf<T>>(key: K, value: T[K]) => Promise<void>;
  getItem: <K extends StringKeyOf<T>>(key: K, defaultValue?: T[K]) => Promise<T[K] | null>;
  hasItem: (key: string) => Promise<boolean>;
  getKeys: () => Promise<string[]>;
  removeItem: (key: StringKeyOf<T> | StringKeyOf<T>[]) => Promise<void>;
  clear: () => Promise<void>;
  subscribe: <K extends StringKeyOf<T>>(key: K, callback: (value: T[K] | null) => void) => VoidFunction;
  watch: (callback: (event: 'update' | 'remove', key: string) => void) => VoidFunction;
}

export interface CreateStorageOptions {
  /**
   * @default "local"
   */
  area?: chrome.storage.AreaName;
  prefix?: string;
}

export function createStorage<T extends Record<string, any> = Record<string, any>>(
  options?: CreateStorageOptions
): ChromeStorage<T> {
  const { area = 'local', prefix } = options || {};
  const storage = chrome.storage[area];
  const [addPrefix, removePrefix] = createPrefixHelpers(prefix);

  async function setItem<K extends StringKeyOf<T>>(key: K, value: T[K]): Promise<void> {
    return storage.set({ [addPrefix(key)]: value });
  }

  async function getItem<K extends StringKeyOf<T>>(key: K, defaultValue?: T[K]): Promise<T[K] | null> {
    const prefixedKey = addPrefix(key);
    const result = await storage.get(prefixedKey);
    return prefixedKey in result ? result[prefixedKey] : arguments.length === 2 ? defaultValue : null;
  }

  async function hasItem(key: string): Promise<boolean> {
    const prefixedKey = addPrefix(key);
    const result = await storage.get(prefixedKey);
    return prefixedKey in result;
  }

  async function getKeys(): Promise<string[]> {
    const result = await storage.get();
    const prefixedKeys = Object.keys(result);
    if (!prefix) return prefixedKeys;
    return prefixedKeys.filter((key) => key.startsWith(prefix)).map(removePrefix);
  }

  async function removeItem(key: StringKeyOf<T> | StringKeyOf<T>[]): Promise<void> {
    return storage.remove(Array.isArray(key) ? key.map(addPrefix) : addPrefix(key));
  }

  async function clear(): Promise<void> {
    if (!prefix) return storage.clear();
    const keys = await getKeys();
    return storage.remove(keys.map(addPrefix));
  }

  type OnChangedListener = Parameters<(typeof storage)['onChanged']['addListener']>[0];

  let onChangedActive = false;
  const onChangedCallbacks = new Map<string, Set<(value: any) => void>>();
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

  function subscribe<K extends StringKeyOf<T>>(key: K, callback: (value: T[K] | null) => void): VoidFunction {
    const prefixedKey = addPrefix(key);
    addCallback(prefixedKey, callback);
    return () => {
      removeCallback(prefixedKey, callback);
    };
  }

  function watch(callback: (type: 'update' | 'remove', key: string) => void): VoidFunction {
    const listener: OnChangedListener = (changes) => {
      for (const [key, value] of Object.entries(changes)) {
        const type = 'newValue' in value ? 'update' : 'remove';
        callback(type, removePrefix(key));
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

function identity<T>(value: T): T {
  return value;
}

type StringTransformer = (key: string) => string;

function createPrefixHelpers(prefix?: string): [StringTransformer, StringTransformer] {
  if (!prefix) return [identity, identity];
  const len = prefix.length;
  const add: StringTransformer = (key) => prefix + key;
  const remove: StringTransformer = (key) => (key.startsWith(prefix) ? key.slice(len) : key);
  return [add, remove];
}
