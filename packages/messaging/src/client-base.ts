import {
  ClientType,
  MessageTarget,
  NAMESPACE,
  SendFn,
  SendOptions,
  TimeoutError,
  WebxMessage,
  WebxMessageListener,
  createSubscriber,
  isWebxMessage,
  randomID,
  withResolvers,
} from './shared';

export const id = randomID();
const listeners = new Set<WebxMessageListener>();

type PromiseResolvers<T> = ReturnType<typeof withResolvers<T>>;

const ongoingMessageResolversMap = new Map<string, PromiseResolvers<any>>();

let clientType: ClientType;
export let port: chrome.runtime.Port | undefined;

function handleMessage(message: unknown) {
  if (!isWebxMessage(message)) return;
  if (listeners.size) {
    const subscriber = createSubscriber(message, send);
    listeners.forEach((listener) => listener(message, subscriber));
  }
  const { id, cmd, data } = message;
  const resolver = ongoingMessageResolversMap.get(id);
  if (resolver) {
    if (cmd) {
      if (cmd === 'next' || cmd === 'complete') {
        resolver.resolve(data);
        ongoingMessageResolversMap.delete(id);
      } else if (cmd === 'error') {
        resolver.reject(data);
        ongoingMessageResolversMap.delete(id);
      }
    } else {
      resolver.resolve(data);
      ongoingMessageResolversMap.delete(id);
    }
  }
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

export const send: SendFn = (data: unknown, options?: SendOptions) => {
  const { id, ...messages } = options || {};
  const port = ensureClient(clientType);
  port.postMessage({
    ...messages,
    id: id || randomID(),
    data,
  } satisfies WebxMessage);
};

export interface RequestOptions {
  to?: MessageTarget;
  timeout?: number;
}

export function request<T>(data: unknown, options?: RequestOptions) {
  const { to, timeout } = options || {};
  const id = randomID();

  send(data, { type: 'promise', to, id });

  const resolvers = withResolvers<T>();
  ongoingMessageResolversMap.set(id, resolvers);

  if (timeout) {
    setTimeout(() => {
      resolvers.reject(new TimeoutError());
      ongoingMessageResolversMap.delete(id);
    }, timeout);
  }

  return resolvers.promise;
}

export function off(listener: WebxMessageListener) {
  listeners.delete(listener);
}

export function on(listener: WebxMessageListener) {
  listeners.add(listener);
  return () => off(listener);
}
