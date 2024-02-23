import { atomWithStorage } from 'jotai/utils';
import { createStorage } from '@webx-kit/storage';

const configStorage = createStorage({ prefix: 'config:' });

export type ColorScheme = 'light' | 'dark' | 'system';

export const colorSchemeAtom = atomWithStorage<ColorScheme>('color-scheme', 'system', configStorage, {
  getOnInit: true,
});
