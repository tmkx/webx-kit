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
