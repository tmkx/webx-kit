import { atomWithStorage } from 'jotai/utils';
import { createStorage } from '@/index';

const chromeStorage = createStorage({
  prefix: 'jotai:',
});

export const apiKeyAtom = atomWithStorage<string>('apiKey', 'DEFAULT', chromeStorage);
