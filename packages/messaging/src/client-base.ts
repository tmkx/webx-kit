import { Observable, Observer, Subscriber } from 'rxjs';
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

const ongoingRequestResolversMap = new Map<string, PromiseResolvers<any>>();
const ongoingStreamSubscribersMap = new Map<string, Set<Subscriber<any>>>();

let clientType: ClientType;
export let port: chrome.runtime.Port | undefined;

function handleMessage(message: unknown) {
  if (!isWebxMessage(message)) return;
  if (listeners.size) {
    const subscriber = createSubscriber(message, send);
    listeners.forEach((listener) => listener(message, subscriber));
  }
  const { id, cmd, data } = message;
  const resolver = ongoingRequestResolversMap.get(id);
  if (resolver) {
    if (!cmd || cmd === 'next' || cmd === 'complete') {
      resolver.resolve(data);
      ongoingRequestResolversMap.delete(id);
    } else if (cmd === 'error') {
      resolver.reject(data);
      ongoingRequestResolversMap.delete(id);
    }
  }

  const subscriber = ongoingStreamSubscribersMap.get(id);
  if (subscriber) {
    if (!cmd || cmd === 'next') {
      subscriber.forEach((s) => s.next(data));
    } else if (cmd === 'error') {
      subscriber.forEach((s) => s.error(data));
      ongoingRequestResolversMap.delete(id);
    } else if (cmd === 'complete') {
      subscriber.forEach((s) => s.complete());
      ongoingRequestResolversMap.delete(id);
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
  ongoingRequestResolversMap.set(id, resolvers);

  if (timeout) {
    setTimeout(() => {
      resolvers.reject(new TimeoutError());
      ongoingRequestResolversMap.delete(id);
    }, timeout);
  }

  return resolvers.promise;
}

export function stream<T>(
  data: unknown,
  observerOrNext: Partial<Observer<T>> | ((value: T) => void),
  options?: RequestOptions
) {
  const { to, timeout } = options || {};
  const id = randomID();

  if (timeout) {
    setTimeout(() => {
      ongoingStreamSubscribersMap.delete(id);
    }, timeout);
  }

  send(data, { type: 'subscription', to, id });
  const subscribers = new Set<Subscriber<any>>();
  ongoingStreamSubscribersMap.set(id, subscribers);
  const ob$ = new Observable<T>(function (subscriber) {
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
      if (ongoingRequestResolversMap.has(id)) {
        send(data, { type: 'subscription', to, id, cmd: 'unsubscribe' });
      }
    };
  });
  return ob$.subscribe(observerOrNext);
}

export function off(listener: WebxMessageListener) {
  listeners.delete(listener);
}

export function on(listener: WebxMessageListener) {
  listeners.add(listener);
  return () => off(listener);
}
