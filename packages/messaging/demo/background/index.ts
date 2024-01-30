import { createCustomHandler } from '@/background';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const { connections } = createCustomHandler({
  async requestHandler(message) {
    return {
      reply: 'background',
      data: message.data,
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

// @ts-expect-error
globalThis.__webxConnections = connections;
