import { AnyTRPCRouter } from '@trpc/server';
import { Messaging, createMessaging, fromChromePort } from './core';
import { applyMessagingHandler } from './core/trpc';
import { NAMESPACE, RequestHandler, StreamHandler, WebxMessage, isWebxMessage } from './shared';

export type WebxMessageMiddleware = (
  message: WebxMessage,
  port: chrome.runtime.Port
) => WebxMessage | false | void | Promise<WebxMessage | false | void>;

// #region middlewares
const senderInfoMiddleware: WebxMessageMiddleware = (message, port) => {
  return {
    from: port.name.slice(NAMESPACE.length),
    tabId: port.sender?.tab?.id,
    ...message,
  };
};
// #endregion

const middlewares = new Set<WebxMessageMiddleware>([senderInfoMiddleware]);

async function applyMiddlewares(message: WebxMessage, port: chrome.runtime.Port) {
  for (const middleware of middlewares) {
    const modifiedMessage = await middleware(message, port);
    if (modifiedMessage === false) return message;
    if (modifiedMessage) message = modifiedMessage;
  }
  return message;
}

export interface CustomHandlerOptions {
  requestHandler?: RequestHandler;
  streamHandler?: StreamHandler;
}

export function createCustomHandler({
  requestHandler = () => Promise.reject(),
  streamHandler = (_, subscriber) => {
    subscriber.error('unimplemented');
  },
}: CustomHandlerOptions) {
  const connections = new Set<Messaging>();

  const listener = (port: chrome.runtime.Port): void => {
    if (!port.name.startsWith(NAMESPACE)) return;
    const messaging = createMessaging(fromChromePort(port), {
      async onRequest(message) {
        if (!isWebxMessage(message)) return Promise.reject('unknown message');
        const webxMessage = await applyMiddlewares(message, port);

        if (!webxMessage.to) return requestHandler(webxMessage);

        for (const connection of connections) {
          if (connection.name === port.name) continue;
          if (connection.name.slice(NAMESPACE.length).startsWith(webxMessage.to)) {
            return connection.request(webxMessage);
          }
        }

        return Promise.reject('no target');
      },
      async onStream(message, subscriber) {
        if (!isWebxMessage(message)) return subscriber.error('unknown message');
        const webxMessage = await applyMiddlewares(message, port);

        if (!webxMessage.to) return streamHandler(webxMessage, subscriber);

        for (const connection of connections) {
          if (connection.name === port.name) continue;
          if (connection.name.slice(NAMESPACE.length).startsWith(webxMessage.to)) {
            return connection.stream(webxMessage, subscriber);
          }
        }

        subscriber.error('no target');
      },
      onDispose() {
        connections.delete(messaging);
      },
    });
    connections.add(messaging);
  };
  chrome.runtime.onConnect.addListener(listener);
  return {
    connections,
    dispose() {
      chrome.runtime.onConnect.removeListener(listener);
    },
  };
}

export interface TrpcHandlerOptions<TRouter extends AnyTRPCRouter> {
  router: TRouter;
}

export function createTrpcHandler<TRouter extends AnyTRPCRouter>({ router }: TrpcHandlerOptions<TRouter>) {
  const connections = new Set<Messaging>();

  const listener = (port: chrome.runtime.Port): void => {
    if (!port.name.startsWith(NAMESPACE)) return;
    const messaging = applyMessagingHandler({
      port: fromChromePort(port),
      router,
      onDispose() {
        connections.delete(messaging);
      },
    });
    connections.add(messaging);
  };
  chrome.runtime.onConnect.addListener(listener);
  return {
    connections,
    dispose() {
      chrome.runtime.onConnect.removeListener(listener);
    },
  };
}
