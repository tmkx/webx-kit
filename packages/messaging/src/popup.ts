import { ensureClient } from './client-base';
export { send, on, request, stream } from './client-base';

export const client = ensureClient('popup');
