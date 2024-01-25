import {
  NAMESPACE,
  SendFn,
  SendOptions,
  WebxMessage,
  WebxMessageListener,
  createSubscriber,
  isWebxMessage,
  randomID,
} from './shared';

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

export const connections = new Set<chrome.runtime.Port>();

export const middlewares = new Set<WebxMessageMiddleware>([senderInfoMiddleware]);
export const listeners = new Set<WebxMessageListener>();

async function handleMessage(message: unknown, port: chrome.runtime.Port) {
  if (!isWebxMessage(message)) return;
  let webxMessage = message;

  for (const middleware of middlewares) {
    const modifiedMessage = await middleware(webxMessage, port);
    if (modifiedMessage === false) return;
    if (modifiedMessage) webxMessage = modifiedMessage;
  }

  if (!webxMessage.to) {
    if (listeners.size) {
      const subscriber = createSubscriber(message, send);
      listeners.forEach((listener) => listener(webxMessage, subscriber));
    }
    return;
  }

  for (const connection of connections) {
    if (connection === port) continue;
    if (connection.name.slice(NAMESPACE.length).startsWith(webxMessage.to)) {
      connection.postMessage(webxMessage);
      break;
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

export const send: SendFn = (data: unknown, options?: SendOptions) => {
  const { to, id, cmd } = options || {};
  const normalizedTarget = `${NAMESPACE}${to}`;
  const normalizedId = id || randomID();

  for (const conn of connections) {
    if (conn.name.startsWith(normalizedTarget)) {
      conn.postMessage({
        id: normalizedId,
        data,
        cmd,
      } satisfies WebxMessage);
      break;
    }
  }
};
