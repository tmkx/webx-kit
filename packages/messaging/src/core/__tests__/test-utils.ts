import { expect } from 'vitest';
import { Messaging, Port } from '../index';

export function fromMessagePort(port: MessagePort): Port {
  return {
    send: (message) => port.postMessage(message),
    onMessage(listener) {
      const ac = new AbortController();
      port.addEventListener('message', (ev) => listener(ev.data), { signal: ac.signal });
      return ac.abort.bind(ac);
    },
  };
}

export function expectMessagingIsNotLeaked(messaging: Messaging) {
  // @ts-expect-error
  expect(messaging.ongoingRequestResolvers).toHaveLength(0);
  // @ts-expect-error
  expect(messaging.ongoingStreamObservers).toHaveLength(0);
}
