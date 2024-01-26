import { ensureClient } from './client-base';
export { setRequestHandler, setStreamHandler } from './client-base';

export const client = ensureClient('popup');
