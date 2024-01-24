import { connections, on } from '@/background';

// @ts-expect-error
globalThis.__webxConnections = connections;

// @ts-expect-error
globalThis.__on = on;

on(console.debug.bind('background'));
