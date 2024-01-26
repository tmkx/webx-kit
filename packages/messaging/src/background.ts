import { Messaging, createMessaging, fromChromePort } from './core';
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

export const connections = new Set<Messaging>();

const middlewares = new Set<WebxMessageMiddleware>([senderInfoMiddleware]);

async function applyMiddlewares(message: WebxMessage, port: chrome.runtime.Port) {
  for (const middleware of middlewares) {
    const modifiedMessage = await middleware(message, port);
    if (modifiedMessage === false) return message;
    if (modifiedMessage) message = modifiedMessage;
  }
  return message;
}

let requestHandler: RequestHandler = () => Promise.reject();
let streamHandler: StreamHandler = (_, subscriber) => {
  subscriber.error('unimplemented');
};

chrome.runtime.onConnect.addListener((port) => {
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
});

export function setRequestHandler(handler: RequestHandler) {
  requestHandler = handler;
}

export function setStreamHandler(handler: StreamHandler) {
  streamHandler = handler;
}
