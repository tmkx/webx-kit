import { NAMESPACE, WebxMessage, WebxMessageListener, isWebxMessage } from './shared';

export type WebxMessageMiddleware = (
  message: WebxMessage,
  port: chrome.runtime.Port
) => WebxMessage | false | void | Promise<WebxMessage | false | void>;

// #region middlewares
const tabIdMiddleware: WebxMessageMiddleware = (message, port) => {
  return {
    tabId: port.sender?.tab?.id,
    ...message,
  };
};
// #endregion

export const connections = new Set<chrome.runtime.Port>();

export const middlewares = new Set<WebxMessageMiddleware>([tabIdMiddleware]);
export const listeners = new Set<WebxMessageListener>();

async function handleMessage(message: unknown, port: chrome.runtime.Port) {
  if (!isWebxMessage(message)) return;
  let webxMessage = message;
  console.debug('RECEIVE', message, 'FROM', port);

  for (const middleware of middlewares) {
    const modifiedMessage = await middleware(webxMessage, port);
    if (modifiedMessage === false) return;
    if (modifiedMessage) webxMessage = modifiedMessage;
  }

  for (const connection of connections) {
    if (connection === port) continue;
    switch (webxMessage.to) {
      case undefined: {
        listeners.forEach((listener) => listener(webxMessage));
        break;
      }
      case '*': {
        connection.postMessage(webxMessage);
        break;
      }
      default: {
        if (connection.name.slice(NAMESPACE.length).startsWith(webxMessage.to)) connection.postMessage(webxMessage);
      }
    }
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (!port.name.startsWith(NAMESPACE)) return;
  connections.add(port);
  port.onMessage.addListener(handleMessage);
  port.onDisconnect.addListener((port) => connections.delete(port));
});

export function unregisterMiddleware(middleware: WebxMessageMiddleware) {
  middlewares.delete(middleware);
}

export function registerMiddleware(middleware: WebxMessageMiddleware) {
  middlewares.add(middleware);
  return () => unregisterMiddleware(middleware);
}

export function off(listener: WebxMessageListener) {
  listeners.delete(listener);
}

export function on(listener: WebxMessageListener) {
  listeners.add(listener);
  return () => off(listener);
}
