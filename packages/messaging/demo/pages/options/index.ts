import { createCustomHandler } from '@/client';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const { messaging } = createCustomHandler({
  type: 'options',
  requestHandler(message) {
    return {
      reply: 'options',
      data: message,
    };
  },
  async streamHandler(_message, subscriber) {
    await sleep(50);
    subscriber.next('options 1');
    await sleep(50);
    subscriber.next('options 2');
    await sleep(50);
    subscriber.next('options 3');
    subscriber.complete();
  },
});

// @ts-expect-error
globalThis.__clientMessaging = messaging;
