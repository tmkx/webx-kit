import { connections, setRequestHandler, setStreamHandler } from '@/background';

// @ts-expect-error
globalThis.__webxConnections = connections;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

setRequestHandler(async (message) => {
  return {
    reply: 'background',
    data: message.data,
  };
});

setStreamHandler(async (_message, subscriber) => {
  await sleep(50);
  subscriber.next(1);
  await sleep(50);
  subscriber.next(2);
  await sleep(50);
  subscriber.next(3);
  subscriber.complete();
});
