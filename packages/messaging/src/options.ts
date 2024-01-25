import { ensureClient } from './client-base';
export { send, on, request } from './client-base';

export const client = ensureClient('options');
