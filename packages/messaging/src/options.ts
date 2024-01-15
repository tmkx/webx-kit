import { ensureClient } from './client-base';
export { send, on } from './client-base';

export const client = ensureClient('options');
