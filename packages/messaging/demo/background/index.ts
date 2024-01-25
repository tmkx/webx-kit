import { connections, on, send } from '@/background';

// @ts-expect-error
globalThis.__webxConnections = connections;

// @ts-expect-error
globalThis.__on = on;
// @ts-expect-error
globalThis.__send = send;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

on(async (message, subscriber) => {
  console.log('RECEIVE', message);
  if (message.type === 'promise') {
    subscriber.reply({
      reply: 'background',
      data: message.data,
    });
  } else if (message.type === 'subscription' && message.cmd !== 'unsubscribe') {
    await sleep(50);
    subscriber.next(1);
    await sleep(50);
    subscriber.next(2);
    await sleep(50);
    subscriber.next(3);
    subscriber.complete();
  }
});
