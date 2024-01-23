import { useCallback, useEffect, useState } from 'react';
import { createStorage } from 'unstorage';
import { createDriver } from '@/unstorage';

export const storage = createStorage({
  driver: createDriver(),
});

export function useUnstorage(key: string, defaultValue?: any) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const refresh = () => storage.getItem(key).then((v) => setValue(v ?? defaultValue));
    refresh();
    const unwatch = storage.watch((_type, changedKey) => changedKey === key && refresh());
    return () => void unwatch.then((unwatch) => unwatch());
  }, [key]);

  const handleSetValue = useCallback(
    (value: any) => {
      storage.setItem(key, value).then(() => {
        setValue(value);
      });
    },
    [key]
  );

  return [value, handleSetValue] as const;
}
