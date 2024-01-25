import { connections, on, send } from '@/background';

// @ts-expect-error
globalThis.__webxConnections = connections;

// @ts-expect-error
globalThis.__on = on;
// @ts-expect-error
globalThis.__send = send;

on((message, subscriber) => {
  console.log('RECEIVE', message);
  subscriber.reply({
    reply: 'background',
    data: message.data,
  });
});
