import { createCustomHandler } from '@/popup';
import '../../global.css';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const { messaging } = createCustomHandler({
  requestHandler(message) {
    return {
      reply: 'popup',
      data: message,
    };
  },
  async streamHandler(_message, subscriber) {
    await sleep(50);
    subscriber.next('popup 1');
    await sleep(50);
    subscriber.next('popup 2');
    await sleep(50);
    subscriber.next('popup 3');
    subscriber.complete();
  },
});

// @ts-expect-error
globalThis.__clientMessaging = messaging;
