import { Port, RequestHandler, StreamHandler, createMessaging } from './core';
import { randomID } from './core/utils';
import { createTRPCClient } from '@trpc/client';
import { ClientType, MessageTarget, WebxMessage, isWebxMessage, wrapMessaging } from './shared';
import type { AnyTRPCRouter } from '@trpc/server';
import { messagingLink } from './core/trpc';

const clientPort: Port = {
  onMessage(listener) {
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  },
  send(message) {
    if (typeof message?.d?.to === 'number') {
      chrome.tabs.sendMessage(message.d.to, message);
      return;
    }
    chrome.runtime.sendMessage(message);
  },
};

function shouldSkip(name: string, data: unknown) {
  if (!isWebxMessage(data)) return true;
  const { to } = data;
  // - string: all extension pages (including background) will receive
  // - number: only the specific page will receive the message, so it's unnecessary to check
  return !((typeof to === 'string' && name.startsWith(to)) || typeof to === 'number');
}

export interface CustomHandlerOptions {
  type: ClientType;
  requestHandler?: RequestHandler;
  streamHandler?: StreamHandler;
}

export function createCustomHandler({ type, requestHandler, streamHandler }: CustomHandlerOptions) {
  const id = randomID();
  const name = `${type}@${id}`;

  const messaging = createMessaging(
    { ...clientPort, name },
    {
      intercept: (data: WebxMessage, abort) => (shouldSkip(name, data) ? abort : data.data),
      onRequest: requestHandler || (() => Promise.reject()),
      onStream:
        streamHandler ||
        ((_, subscriber) => {
          subscriber.error('unimplemented');
        }),
    }
  );

  return {
    messaging: wrapMessaging(messaging),
    type,
    id,
    dispose() {
      messaging.dispose();
    },
  };
}

export interface TrpcClientOptions {
  type: ClientType;
  to?: MessageTarget;
}

export function createTrpcClient<TRouter extends AnyTRPCRouter>({ type, to = 'background' }: TrpcClientOptions) {
  const id = randomID();
  const name = `${type}@${id}`;

  const messaging = wrapMessaging(
    createMessaging(
      { ...clientPort, name },
      {
        intercept: (data: WebxMessage, abort) => (shouldSkip(name, data) ? abort : data.data),
      }
    )
  );
  messaging.request = (message) => messaging.requestTo(to, message);
  messaging.stream = (message, subscriber) => messaging.streamTo(to, message, subscriber);
  const link = messagingLink({ messaging });
  const client = createTRPCClient<TRouter>({
    links: [link],
  });

  return {
    messaging,
    client,
    type,
    id,
    dispose() {
      messaging.dispose();
    },
  };
}
