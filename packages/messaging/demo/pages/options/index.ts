import { client, send, on } from '@/options';

// @ts-expect-error
globalThis.__client = client;
// @ts-expect-error
globalThis.__send = send;
// @ts-expect-error
globalThis.__on = on;

on(console.debug.bind('options'));
