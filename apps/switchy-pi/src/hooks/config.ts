import { useLayoutEffect } from 'react';
import { useAtomValue } from 'jotai';
import { isDarkAtom } from '@/atoms/config';

export function useBodyThemeClass() {
  const isDark = useAtomValue(isDarkAtom);

  useLayoutEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(isDark ? 'dark' : 'light');
  }, [isDark]);
}
