import { createCustomHandler } from '@/content-script';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const { messaging } = createCustomHandler({
  requestHandler(message) {
    return {
      reply: 'content-script',
      data: message,
    };
  },
  async streamHandler(_message, subscriber) {
    await sleep(50);
    subscriber.next('content-script 1');
    await sleep(50);
    subscriber.next('content-script 2');
    await sleep(50);
    subscriber.next('content-script 3');
    subscriber.complete();
  },
});

// @ts-expect-error
globalThis.__clientMessaging = messaging;
