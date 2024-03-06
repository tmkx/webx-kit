import { useEffect, useLayoutEffect } from 'react';
import { getDefaultStore, useAtomValue } from 'jotai';
import { isDarkAtom } from '@/atoms/config';
import { proxyModeAtom } from '@/atoms/proxy';
import { activeProfileIdAtom } from '@/atoms/profile';

export function Provider({ children }: React.PropsWithChildren<unknown>) {
  useBodyThemeClass();
  return (
    <>
      {children}
      <GlobalDeps />
    </>
  );
}

const store = getDefaultStore();
function GlobalDeps() {
  useEffect(() => {
    function noop() {}
    const subscriptions = [proxyModeAtom, activeProfileIdAtom].map((atom) => store.sub(atom, noop));
    return () => subscriptions.forEach((unsub) => unsub());
  }, []);
  return null;
}

function useBodyThemeClass() {
  const isDark = useAtomValue(isDarkAtom);

  useLayoutEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(isDark ? 'dark' : 'light');
  }, [isDark]);
}
