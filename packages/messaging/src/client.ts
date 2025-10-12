import { createTRPCClient } from '@trpc/client';
import type { AnyTRPCRouter } from '@trpc/server';
import type { SetOptional } from 'type-fest';
import { Port, RequestHandler, StreamHandler, createMessaging } from './core';
import { messagingLink } from './core/trpc';
import { randomID } from './core/utils';
import { ClientType, MessageTarget, WebXMessage, isWebXMessage, wrapMessaging } from './shared';

const clientPort: Port = {
  onMessage(listener) {
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  },
  send(message) {
    return typeof message?.d?.to === 'number'
      ? chrome.tabs.sendMessage(message.d.to, message)
      : chrome.runtime.sendMessage(message);
  },
};

function shouldSkip(name: string, data: unknown) {
  if (!isWebXMessage(data)) return true;
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

function internalCreateCustomHandler({ type, requestHandler, streamHandler }: CustomHandlerOptions) {
  const id = randomID();
  const name = `${type}@${id}`;

  const messaging = createMessaging(
    { ...clientPort, name },
    {
      intercept: (data: WebXMessage, abort) => (shouldSkip(name, data) ? abort : data.data),
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

function internalCreateTrpcClient<TRouter extends AnyTRPCRouter>({ type, to = 'server' }: TrpcClientOptions) {
  const id = randomID();
  const name = `${type}@${id}`;

  const messaging = wrapMessaging(
    createMessaging(
      { ...clientPort, name },
      {
        intercept: (data: WebXMessage, abort) => (shouldSkip(name, data) ? abort : data.data),
      }
    )
  );
  messaging.request = message => messaging.requestTo(to, message);
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

export const createCustomHandler = (options: SetOptional<CustomHandlerOptions, 'type'>) =>
  internalCreateCustomHandler({ type: 'default', ...options });

export const createTrpcClient = <TRouter extends AnyTRPCRouter>(options: SetOptional<TrpcClientOptions, 'type'>) =>
  internalCreateTrpcClient<TRouter>({ type: 'default', ...options });
