import { atomWithStorage } from 'jotai/utils';
import { createStorage } from '@/index';

const chromeStorage = createStorage();

export const apiKeyAtom = atomWithStorage<string>('apiKey', 'DEFAULT', chromeStorage);
