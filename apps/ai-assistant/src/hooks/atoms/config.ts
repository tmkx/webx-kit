import { atomWithStorage } from 'jotai/utils';
import { createStorage } from '@webx-kit/storage';

const chromeStorage = createStorage();

export const apiKeyAtom = atomWithStorage<string | null>('apiKey', null, chromeStorage);
