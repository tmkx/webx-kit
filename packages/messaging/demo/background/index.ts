import { connections } from '@/background';

// @ts-expect-error
globalThis.__webxConnections = connections;
