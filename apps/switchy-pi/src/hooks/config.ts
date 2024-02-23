import { useLayoutEffect } from 'react';
import { useAtomValue } from 'jotai';
import { colorSchemeAtom } from './atoms/config';

export function useBodyThemeClass() {
  const colorScheme = useAtomValue(colorSchemeAtom);

  useLayoutEffect(() => {
    const isDark =
      colorScheme === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches : colorScheme === 'dark';

    document.body.classList.remove('light', 'dark');
    document.body.classList.add(isDark ? 'dark' : 'light');
  }, [colorScheme]);
}
