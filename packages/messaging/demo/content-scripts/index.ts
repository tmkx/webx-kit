import { client, send, on, request } from '@/content-script';

// @ts-expect-error
globalThis.__client = client;
// @ts-expect-error
globalThis.__send = send;
// @ts-expect-error
globalThis.__on = on;
// @ts-expect-error
globalThis.__request = request;

on((message, subscriber) => {
  console.log(message);
  subscriber.reply({
    reply: 'content-script',
    data: message.data,
  });
});
