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
          return await sleep(0, `Hello, ${message.data.name}`);
        default:
          throw new Error('Unknown method');
      }
    },
  });
  const sender = createMessaging(fromMessagePort(port2));

  await expect(sender.request('hello', { name: 'Tmk' })).resolves.toEqual('Hello, Tmk');
  await expect(sender.request('greet', { name: 'Tmk' })).rejects.toThrow('Unknown method');
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
          return () => {
            console.log('cleanup');
          };
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
      sender.stream('hello', null, {
        next: (value) => result.push(value),
        error: (reason) => reject(reason),
        complete: () => resolve(result),
      });
    })
  ).resolves.toEqual([1, 2, 3]);

  await expect(
    new Promise<unknown[]>((resolve, reject) => {
      const result: unknown[] = [];
      sender.stream('greet', null, {
        next: (value) => result.push(value),
        error: (reason) => reject(reason),
        complete: () => resolve(result),
      });
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
          const timer = setInterval(() => {
            subscriber.next(i++);
          }, message.data);
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
      const unsubscribe = sender.stream('hello', 30, {
        next: (value) => result.push(value),
        error: (reason) => reject(reason),
        complete: completeFn,
      });
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
