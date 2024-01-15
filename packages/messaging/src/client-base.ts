import { ClientType, NAMESPACE, WebxMessage, isWebxMessage } from './shared';

export type WebxMessageListener = (message: WebxMessage) => void;

export const id = crypto.randomUUID();
const listeners = new Set<WebxMessageListener>();

let clientType: ClientType;
export let port: chrome.runtime.Port | undefined;

function handleMessage(message: unknown) {
  if (!isWebxMessage(message)) return;
  listeners.forEach((listener) => listener(message));
}

export function ensureClient(type: ClientType) {
  clientType = type;
  if (!port) {
    port = chrome.runtime.connect({ name: `${NAMESPACE}${type}@${id}` });
    port.onDisconnect.addListener(() => (port = undefined));
    port.onMessage.addListener(handleMessage);
  }
  return port;
}

export function send(data: unknown, target?: ClientType) {
  const port = ensureClient(clientType);
  port.postMessage({
    id: crypto.randomUUID(),
    from: `${clientType}@${id}`,
    to: target,
    data,
  } satisfies WebxMessage);
}

export function off(listener: (message: WebxMessage) => void) {
  listeners.delete(listener);
}

export function on(listener: (message: WebxMessage) => void) {
  listeners.add(listener);
  return () => off(listener);
}
