import type { Observer } from 'type-fest';
import { Messaging, createMessaging, fromChromePort } from './core';
import { randomID } from './core/utils';
import { ClientType, NAMESPACE, RequestHandler, StreamHandler, WebxMessage } from './shared';

export interface CustomHandlerOptions {
  type: ClientType;
  requestHandler?: RequestHandler;
  streamHandler?: StreamHandler;
}

export function createCustomHandler({
  type,
  requestHandler = () => Promise.reject(),
  streamHandler = (_, subscriber) => {
    subscriber.error('unimplemented');
  },
}: CustomHandlerOptions) {
  const id = randomID();
  const port = chrome.runtime.connect({ name: `${NAMESPACE}${type}@${id}` });
  const messaging = createMessaging(fromChromePort(port), {
    onRequest(message) {
      return requestHandler(message);
    },
    onStream(message, subscriber) {
      return streamHandler(message, subscriber);
    },
  });

  return {
    messaging: wrapMessaging(messaging),
    type,
    id,
    dispose() {
      messaging.dispose();
    },
  };
}

function wrapMessaging(messaging: Messaging) {
  return {
    request(data: unknown, to?: ClientType) {
      return messaging.request({ data, to } satisfies WebxMessage);
    },
    stream(data: unknown, observer: Partial<Observer<any>>, to?: ClientType) {
      return messaging.stream({ data, to } satisfies WebxMessage, observer);
    },
  };
}

export type WrappedMessaging = ReturnType<typeof wrapMessaging>;
