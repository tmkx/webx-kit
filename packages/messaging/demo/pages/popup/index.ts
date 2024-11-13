import { createCustomHandler } from '@/client';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const { messaging } = createCustomHandler({
  type: 'popup',
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
