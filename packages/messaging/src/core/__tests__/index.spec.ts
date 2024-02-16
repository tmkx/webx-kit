import { setTimeout as sleep } from 'node:timers/promises';
import { expect, it, vi } from 'vitest';
import { createMessaging } from '../index';
import { withResolvers } from '../utils';
import { expectMessagingIsNotLeaked, fromMessagePort } from './test-utils';

it('should support request', async () => {
  const { port1, port2 } = new MessageChannel();

  const receiver = createMessaging(fromMessagePort(port1), {
    async onRequest(message) {
      switch (message.name) {
        case 'hello':
          return await sleep(0, `Hello, ${message.user}`);
        default:
          throw new Error('Unknown method');
      }
    },
  });
  const sender = createMessaging(fromMessagePort(port2));

  await expect(sender.request({ name: 'hello', user: 'Tmk' })).resolves.toEqual('Hello, Tmk');
  await expect(sender.request({ name: 'greet', user: 'Tmk' })).rejects.toThrow('Unknown method');

  expectMessagingIsNotLeaked(receiver);
  expectMessagingIsNotLeaked(sender);
});

it('should support stream', async () => {
  const { port1, port2 } = new MessageChannel();

  const receiver = createMessaging(fromMessagePort(port1), {
    async onStream(message, subscriber) {
      switch (message.name) {
        case 'hello': {
          subscriber.next(1);
          subscriber.next(2);
          subscriber.next(3);
          subscriber.complete();
        }
        default:
          throw new Error('Unknown method');
      }
    },
  });
  const sender = createMessaging(fromMessagePort(port2));

  await expect(
    new Promise<unknown[]>((resolve, reject) => {
      const result: unknown[] = [];
      sender.stream(
        { name: 'hello' },
        {
          next: (value) => result.push(value),
          error: (reason) => reject(reason),
          complete: () => resolve(result),
        }
      );
    })
  ).resolves.toEqual([1, 2, 3]);

  await expect(
    new Promise<unknown[]>((resolve, reject) => {
      const result: unknown[] = [];
      sender.stream(
        { name: 'greet' },
        {
          next: (value) => result.push(value),
          error: (reason) => reject(reason),
          complete: () => resolve(result),
        }
      );
    })
  ).rejects.toThrow('Unknown method');

  expectMessagingIsNotLeaked(receiver);
  expectMessagingIsNotLeaked(sender);
});

it('should support abort stream', async () => {
  const { port1, port2 } = new MessageChannel();

  const cleanResolver = withResolvers<void>();
  const cleanupFn = vi.fn();
  const receiver = createMessaging(fromMessagePort(port1), {
    async onStream(message, subscriber) {
      switch (message.name) {
        case 'hello': {
          let i = 0;
          const timer = setInterval(() => subscriber.next(i++), message.interval);
          return () => {
            clearInterval(timer);
            cleanupFn();
            cleanResolver.resolve();
          };
        }
        default:
          throw new Error('Unknown method');
      }
    },
  });
  const sender = createMessaging(fromMessagePort(port2));

  const completeFn = vi.fn();
  await expect(
    new Promise<unknown[]>((resolve, reject) => {
      const result: unknown[] = [];
      const unsubscribe = sender.stream(
        { name: 'hello', interval: 10 },
        {
          next: (value) => {
            result.push(value);
            if (result.length === 2) {
              unsubscribe();
              resolve(result);
            }
          },
          error: (reason) => reject(reason),
          complete: completeFn,
        }
      );
    })
  ).resolves.toEqual([0, 1]);
  await cleanResolver.promise;
  expect(cleanupFn).toBeCalled();
  expect(completeFn).not.toBeCalled();

  await sleep();
  expectMessagingIsNotLeaked(receiver);
  expectMessagingIsNotLeaked(sender);
});

it('should serialize error message', async () => {
  const { port1, port2 } = new MessageChannel();

  const receiver = createMessaging(fromMessagePort(port1), {
    async onStream(_message, _subscriber) {
      throw new Error('Internal Error');
    },
  });
  const sender = createMessaging(fromMessagePort(port2));

  const { promise, resolve, reject } = withResolvers<void>();
  sender.stream(null, { error: reject, complete: resolve });

  await expect(promise).rejects.toBeTypeOf('string');
  await expect(promise).rejects.toThrow('Internal Error');

  expectMessagingIsNotLeaked(receiver);
  expectMessagingIsNotLeaked(sender);
});

it('should cleanup after sending error', async () => {
  const { port1, port2 } = new MessageChannel();
  const { promise, resolve } = withResolvers<void>();

  const receiverPort = fromMessagePort(port1);
  const receiver = createMessaging(receiverPort, {
    async onStream(_message, subscriber) {
      const timer = setInterval(() => subscriber.next(null), 30);
      return () => {
        clearInterval(timer);
        resolve();
      };
    },
  });
  const sender = createMessaging(fromMessagePort(port2));

  sender.stream(null, {
    next: () => (receiverPort.send = () => Promise.reject('disconnected')),
  });

  await promise;

  expectMessagingIsNotLeaked(receiver);
});

it('should support abort request', async () => {
  const { port1, port2 } = new MessageChannel();

  const receivedResolvers = withResolvers<void>();
  const abortedResolvers = withResolvers();
  const receiver = createMessaging(fromMessagePort(port1), {
    async onRequest(_message, { signal }) {
      receivedResolvers.resolve();
      signal.addEventListener('abort', abortedResolvers.resolve);
      return withResolvers().promise; // never
    },
  });
  const sender = createMessaging(fromMessagePort(port2));

  const ac = new AbortController();
  sender.request({ name: 'hello', user: 'Tmk' }, { signal: ac.signal }).catch(() => {});
  await receivedResolvers.promise;
  ac.abort();
  await abortedResolvers.promise;

  expectMessagingIsNotLeaked(receiver);
  expectMessagingIsNotLeaked(sender);
});
