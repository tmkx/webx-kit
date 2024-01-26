import type { Observer } from 'type-fest';
import { Messaging, createMessaging, fromChromePort } from './core';
import { randomID } from './core/utils';
import { ClientType, NAMESPACE, RequestHandler, StreamHandler, WebxMessage } from './shared';

export const id = randomID();

let clientType: ClientType;
export let client: ReturnType<typeof wrapMessaging> | undefined;

let requestHandler: RequestHandler = () => Promise.reject();
let streamHandler: StreamHandler = (_, subscriber) => {
  subscriber.error('unimplemented');
};

export function ensureClient(type: ClientType) {
  clientType = type;
  if (!client) {
    const port = chrome.runtime.connect({ name: `${NAMESPACE}${type}@${id}` });
    const messaging = createMessaging(fromChromePort(port), {
      onRequest(message) {
        return requestHandler(message);
      },
      onStream(message, subscriber) {
        return streamHandler(message, subscriber);
      },
      onDispose() {
        client = undefined;
      },
    });
    client = wrapMessaging(messaging);
  }
  return client;
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

export function setRequestHandler(handler: RequestHandler) {
  requestHandler = handler;
}

export function setStreamHandler(handler: StreamHandler) {
  streamHandler = handler;
}
