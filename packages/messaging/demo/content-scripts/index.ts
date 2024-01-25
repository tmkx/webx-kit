import { client, send, on, request, stream } from '@/content-script';

// @ts-expect-error
globalThis.__client = client;
// @ts-expect-error
globalThis.__send = send;
// @ts-expect-error
globalThis.__on = on;
// @ts-expect-error
globalThis.__request = request;
// @ts-expect-error
globalThis.__stream = stream;

on((message, subscriber) => {
  console.log(message);
  subscriber.reply({
    reply: 'content-script',
    data: message.data,
  });
});
