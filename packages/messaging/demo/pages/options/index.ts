import { client, setRequestHandler, setStreamHandler } from '@/options';
import '../../global.css';

// @ts-expect-error
globalThis.__client = client;

setRequestHandler((message) => {
  return {
    reply: 'options',
    data: message.data,
  };
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

setStreamHandler(async (_message, subscriber) => {
  await sleep(50);
  subscriber.next('options 1');
  await sleep(50);
  subscriber.next('options 2');
  await sleep(50);
  subscriber.next('options 3');
  subscriber.complete();
});
