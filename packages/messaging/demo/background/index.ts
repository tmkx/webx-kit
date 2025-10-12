import { createCustomHandler } from '@/server';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// @ts-expect-error
globalThis.__messaging = createCustomHandler({
  async requestHandler(message) {
    return {
      reply: 'background',
      data: message,
    };
  },
  async streamHandler(_message, subscriber) {
    await sleep(50);
    subscriber.next(1);
    await sleep(50);
    subscriber.next(2);
    await sleep(50);
    subscriber.next(3);
    subscriber.complete();
  },
});
