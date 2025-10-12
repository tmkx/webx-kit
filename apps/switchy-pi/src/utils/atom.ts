import { Setter, SetStateAction, atom } from 'jotai';
import { RESET } from 'jotai/utils';
import { atomEffect } from 'jotai-effect';

type AtomEffectParameters = Parameters<Parameters<typeof atomEffect>[0]>;

export function syncExternalStateAtom<T>(
  getSnapshot: () => T | Promise<T>,
  watcher: (setSelf: (value: SetStateAction<T>) => void, ...args: AtomEffectParameters) => VoidFunction
) {
  const baseAtom = atom<T>(RESET as T);
  let internalSetter: Setter | undefined;
  let isOutdated = false;

  const aEffect = atomEffect((get, set) => {
    internalSetter = set;
    const setSelf = (value: SetStateAction<T>) => set(baseAtom, value);
    isOutdated && Promise.resolve(getSnapshot()).then(setSelf);
    const cleanup = watcher(setSelf, get, set);
    return () => {
      isOutdated = true;
      setSelf(RESET as T);
      cleanup();
    };
  });
  return atom(get => {
    get(aEffect);
    const value = get(baseAtom);
    if (value !== RESET) return value;
    const newValue = getSnapshot();
    isOutdated = false;
    if (newValue && typeof newValue === 'object' && 'then' in newValue) {
      return newValue.then(v => {
        internalSetter?.(baseAtom, v);
        return v;
      });
    } else {
      internalSetter?.(baseAtom, newValue);
      return newValue;
    }
  });
}
