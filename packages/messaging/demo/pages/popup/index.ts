import { client, setRequestHandler, setStreamHandler } from '@/popup';
import '../../global.css';

// @ts-expect-error
globalThis.__client = client;

setRequestHandler((message) => {
  return {
    reply: 'popup',
    data: message.data,
  };
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

setStreamHandler(async (_message, subscriber) => {
  await sleep(50);
  subscriber.next('popup 1');
  await sleep(50);
  subscriber.next('popup 2');
  await sleep(50);
  subscriber.next('popup 3');
  subscriber.complete();
});
