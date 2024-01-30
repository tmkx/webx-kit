import { setTimeout as sleep } from 'node:timers/promises';
import { expect, it, vi } from 'vitest';
import { Messaging, createMessaging, fromMessagePort } from '../index';
import { withResolvers } from '../utils';

function expectMessagingIsNotLeaked(messaging: Messaging) {
  // @ts-expect-error
  expect(messaging.ongoingRequestResolvers).toHaveLength(0);
  // @ts-expect-error
  expect(messaging.ongoingStreamObservers).toHaveLength(0);
}

it('should on/off listener', async () => {
  const { port1, port2 } = new MessageChannel();
  const listenerFn = vi.fn();

  const resolver = withResolvers<void>();
  const receiver = createMessaging(fromMessagePort(port1), {
    on: (...args) => {
      listenerFn(...args);
      resolver.resolve();
    },
  });

  await (port2.postMessage('hello'), resolver.promise);
  expect(listenerFn).toBeCalledTimes(1);
  expect(listenerFn).toBeCalledWith('hello');

  receiver.dispose();
  await (port2.postMessage('hello'), sleep(10));
  expect(listenerFn).toBeCalledTimes(1);

  expectMessagingIsNotLeaked(receiver);
});

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

it('should support relay request', async () => {
  const { port1, port2 } = new MessageChannel();
  const { port1: port3, port2: port4 } = new MessageChannel();

  const destination = createMessaging(fromMessagePort(port1), {
    async onRequest(message) {
      switch (message.name) {
        case 'hello':
          return await sleep(0, `Hello, ${message.user}`);
        default:
          throw new Error('Unknown method');
      }
    },
  });
  const relay1 = createMessaging(fromMessagePort(port2));
  const relay2 = createMessaging(fromMessagePort(port3), {
    onRequest() {
      return this.relay(relay1);
    },
  });
  const sender = createMessaging(fromMessagePort(port4));

  await expect(sender.request({ name: 'hello', user: 'Tmk' })).resolves.toEqual('Hello, Tmk');
  await expect(sender.request({ name: 'greet', user: 'Tmk' })).rejects.toThrow('Unknown method');

  expectMessagingIsNotLeaked(destination);
  expectMessagingIsNotLeaked(relay1);
  expectMessagingIsNotLeaked(relay2);
  expectMessagingIsNotLeaked(sender);
});

it('should support relay stream', async () => {
  const { port1, port2 } = new MessageChannel();
  const { port1: port3, port2: port4 } = new MessageChannel();

  const destination = createMessaging(fromMessagePort(port1), {
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
  const relay1 = createMessaging(fromMessagePort(port2));
  const relay2 = createMessaging(fromMessagePort(port3), {
    onStream() {
      return this.relay(relay1);
    },
  });
  const sender = createMessaging(fromMessagePort(port4));

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

  expectMessagingIsNotLeaked(destination);
  expectMessagingIsNotLeaked(relay1);
  expectMessagingIsNotLeaked(relay2);
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
