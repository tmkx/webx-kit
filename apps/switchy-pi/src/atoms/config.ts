import { atom } from 'jotai';
import { atomWithStorage, unwrap } from 'jotai/utils';
import { createStorage } from '@webx-kit/storage';

export const configStorage = createStorage({ prefix: 'config:' });

export type ColorScheme = 'light' | 'dark' | 'system';

export const colorSchemeAtom = unwrap(
  atomWithStorage<ColorScheme>('color-scheme', 'system', configStorage),
  () => 'system'
);

export const isDarkAtom = atom((get) => {
  const colorScheme = get(colorSchemeAtom);
  return colorScheme === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches : colorScheme === 'dark';
});
