import { createStorage } from '@/index';

// @ts-expect-error
globalThis.__storage = createStorage();
