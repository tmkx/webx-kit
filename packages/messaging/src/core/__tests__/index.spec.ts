import { setTimeout as sleep } from 'node:timers/promises';
import { expect, it, vi } from 'vitest';
import { createMessaging, fromMessagePort } from '../index';

it('should on/off listener', async () => {
  const { port1, port2 } = new MessageChannel();
  const listenerFn = vi.fn();

  const receiver = createMessaging(fromMessagePort(port1), { on: listenerFn });

  await (port2.postMessage('hello'), sleep(10));
  expect(listenerFn).toBeCalledTimes(1);
  expect(listenerFn).toBeCalledWith('hello');

  receiver.dispose();
  await (port2.postMessage('hello'), sleep(10));
  expect(listenerFn).toBeCalledTimes(1);
});

it('should support request', async () => {
  const { port1, port2 } = new MessageChannel();

  const _receiver = createMessaging(fromMessagePort(port1), {
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
});

it('should support stream', async () => {
  const { port1, port2 } = new MessageChannel();

  const _receiver = createMessaging(fromMessagePort(port1), {
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
});

it('should support abort stream', async () => {
  const { port1, port2 } = new MessageChannel();

  const cleanupFn = vi.fn();
  const _receiver = createMessaging(fromMessagePort(port1), {
    async onStream(message, subscriber) {
      switch (message.name) {
        case 'hello': {
          let i = 0;
          const timer = setInterval(() => subscriber.next(i++), message.interval);
          return () => {
            clearInterval(timer);
            cleanupFn();
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
        { name: 'hello', interval: 30 },
        {
          next: (value) => result.push(value),
          error: (reason) => reject(reason),
          complete: completeFn,
        }
      );
      setTimeout(() => {
        unsubscribe();
        resolve(result);
      }, 80);
    })
  ).resolves.toEqual([0, 1]);
  await sleep(10);
  expect(cleanupFn).toBeCalled();
  expect(completeFn).not.toBeCalled();
});

it('should support relay request', async () => {
  const { port1, port2 } = new MessageChannel();
  const { port1: port3, port2: port4 } = new MessageChannel();

  const _destination = createMessaging(fromMessagePort(port1), {
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
  const _relay2 = createMessaging(fromMessagePort(port3), {
    onRequest() {
      return this.relay(relay1);
    },
  });
  const sender = createMessaging(fromMessagePort(port4));

  await expect(sender.request({ name: 'hello', user: 'Tmk' })).resolves.toEqual('Hello, Tmk');
  await expect(sender.request({ name: 'greet', user: 'Tmk' })).rejects.toThrow('Unknown method');
});

it('should support relay stream', async () => {
  const { port1, port2 } = new MessageChannel();
  const { port1: port3, port2: port4 } = new MessageChannel();

  const _destination = createMessaging(fromMessagePort(port1), {
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
  const _relay2 = createMessaging(fromMessagePort(port3), {
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
});
