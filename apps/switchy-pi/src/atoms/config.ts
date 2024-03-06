import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { createStorage } from '@webx-kit/storage';

export const configStorage = createStorage({ prefix: 'config:' });

export type ColorScheme = 'light' | 'dark' | 'system';

export const colorSchemeAtom = atomWithStorage<ColorScheme>('color-scheme', 'system', undefined, { getOnInit: true });

const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const isSystemDarkAtom = atom(darkQuery.matches);
isSystemDarkAtom.onMount = (set) => {
  const updateState = () => set(darkQuery.matches);
  updateState();
  darkQuery.addEventListener('change', updateState);
  return () => darkQuery.removeEventListener('change', updateState);
};

export const isDarkAtom = atom((get) => {
  const colorScheme = get(colorSchemeAtom);
  return colorScheme === 'system' ? get(isSystemDarkAtom) : colorScheme === 'dark';
});
