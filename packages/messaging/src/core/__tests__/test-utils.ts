import { expect } from 'vitest';
import { Messaging, Port } from '../index';

export function fromMessagePort(port: MessagePort): Port {
  return {
    send: async message => port.postMessage(message),
    onMessage(listener) {
      const ac = new AbortController();
      port.addEventListener('message', ev => listener(ev.data), { signal: ac.signal });
      return ac.abort.bind(ac);
    },
  };
}

export function expectMessagingIsNotLeaked(messaging: Messaging) {
  // @ts-expect-error - test-only maps attached in createMessaging
  expect(messaging.ongoingRequestResolvers.size).toBe(0);
  // @ts-expect-error - test-only maps attached in createMessaging
  expect(messaging.ongoingStreamObservers.size).toBe(0);
}
