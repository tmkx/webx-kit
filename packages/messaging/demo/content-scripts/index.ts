import { client, setRequestHandler, setStreamHandler } from '@/content-script';

// @ts-expect-error
globalThis.__client = client;

setRequestHandler((message) => {
  return {
    reply: 'content-script',
    data: message.data,
  };
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

setStreamHandler(async (_message, subscriber) => {
  await sleep(50);
  subscriber.next('content-script 1');
  await sleep(50);
  subscriber.next('content-script 2');
  await sleep(50);
  subscriber.next('content-script 3');
  subscriber.complete();
});
