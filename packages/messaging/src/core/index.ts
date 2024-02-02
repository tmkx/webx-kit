import type { Promisable, Observer } from 'type-fest';
import { randomID, withResolvers } from './utils';

export type SendMessageFunction = (message: any) => void;
export type CleanupFunction = VoidFunction;

export interface Port {
  name: string;
  postMessage: SendMessageFunction;
  onMessage: (listener: SendMessageFunction) => CleanupFunction;
  onDispose: (listener: VoidCallback) => CleanupFunction;
}

/**
 * @private
 */
interface Packet {
  /**
   * Packet type
   *
   * - `r`: Request / Response
   * - `s`: Stream
   * - `e`: Event
   */
  t: 'r' | 'R' | 's' | 'S' | 'e';

  /**
   * ID
   */
  i: string;

  /**
   * Data
   */
  d: any;
}

export interface RequestContext {
  relay: (to: Messaging) => Promisable<any>;
}

export interface StreamContext {
  relay: (to: Messaging) => Promisable<any>;
}

export interface CreateMessagingOptions {
  onRequest?: (this: RequestContext, message: any) => Promisable<any>;
  onStream?: (this: StreamContext, message: any, subscriber: Observer<any>) => Promisable<CleanupFunction | void>;
  onEvent?: (message: any) => any;
  onDispose?: VoidCallback;
  on?: (message: any) => any;
}

function isPacket(message: any): message is Packet {
  return typeof message === 'object' && message !== null && 't' in message && 'i' in message && 'd' in message;
}

function noop() {}

type PromiseResolvers<T> = ReturnType<typeof withResolvers<T>>;

export interface Messaging {
  name: string;
  request<T>(data: unknown): Promise<T>;
  stream(data: unknown, observer: Partial<Observer<any>>): VoidCallback;
  dispose(): void;
}

export function createMessaging(port: Port, options?: CreateMessagingOptions): Messaging {
  const { on, onRequest, onStream, onDispose } = options || {};
  // sender side
  const ongoingRequestResolvers = new Map<string, PromiseResolvers<any>>();
  const ongoingStreamObservers = new Map<string, Partial<Observer<any>>>();
  // receiver side
  const processingStreamCleanups = new Map<string, CleanupFunction | void>();

  async function handleMessage(message: any) {
    on?.(message);
    if (!isPacket(message)) return;
    switch (message.t) {
      case 'r': {
        if (!onRequest) return;
        let d;
        try {
          const context: RequestContext = {
            relay(to) {
              return to.request(message.d);
            },
          };
          const response = await onRequest.call(context, message.d);
          d = { data: response };
        } catch (err) {
          d = { error: err };
        }
        port.postMessage({ t: 'R', i: message.i, d } satisfies Packet);
        break;
      }
      case 'R': {
        const resolvers = ongoingRequestResolvers.get(message.i);
        if (!resolvers) return;
        const data = message.d;

        if ('data' in data) resolvers.resolve(data.data);
        else resolvers.reject(data.error);

        ongoingRequestResolvers.delete(message.i);
        break;
      }
      case 's': {
        if (!onStream) return;
        function terminate(d: { error: unknown } | { complete: boolean }) {
          port.postMessage({ t: 'S', i: message.i, d } satisfies Packet);
          processingStreamCleanups.get(message.i)?.();
          processingStreamCleanups.delete(message.i);
        }

        // sending again means "unsubscribe"
        if (processingStreamCleanups.has(message.i)) {
          terminate({ complete: false });
          break;
        }

        const observer: Observer<any> = {
          next(value) {
            port.postMessage({ t: 'S', i: message.i, d: { next: value } } satisfies Packet);
          },
          error(error) {
            terminate({ error });
          },
          complete() {
            terminate({ complete: true });
          },
        };

        try {
          const context: StreamContext = {
            relay(to) {
              return to.stream(message.d, observer);
            },
          };
          const cleanup = await onStream.call(context, message.d, observer);
          processingStreamCleanups.set(message.i, cleanup);
        } catch (error) {
          // Error is not serializable in `chrome.runtime.Port`
          terminate({ error: error instanceof Error ? error.message : error });
        }
        break;
      }
      case 'S': {
        const observer = ongoingStreamObservers.get(message.i);
        if (!observer) return;
        const data = message.d;
        if ('next' in data) {
          observer.next?.(data.next);
        } else if ('error' in data) {
          observer.error?.(data.error);
          ongoingStreamObservers.delete(message.i);
        } else if ('complete' in data) {
          data.complete && observer.complete?.();
          ongoingStreamObservers.delete(message.i);
        }
        break;
      }
    }
  }

  let active = false;
  const offListeners: VoidFunction[] = [];

  // chrome.runtime.Port will [auto disconnect](https://developer.chrome.com/docs/extensions/develop/concepts/messaging?hl=en#port-lifetime)
  // so that we need to ensure that there is an active connection
  function ensureActive() {
    if (active) return;
    active = true;
    offListeners.push(port.onMessage(handleMessage));
    offListeners.push(port.onDispose(dispose));
  }
  function dispose() {
    active = false;
    onDispose?.();
    offListeners.forEach((offFn) => offFn());
    offListeners.length = 0;
  }
  ensureActive();

  const messaging: Messaging = {
    name: port.name,
    request<T>(data: unknown) {
      const resolvers = withResolvers<T>();
      const id = randomID();
      ongoingRequestResolvers.set(id, resolvers);
      try {
        ensureActive();
        port.postMessage({ t: 'r', i: id, d: data } satisfies Packet);
      } catch (err) {
        resolvers.reject(err);
      }
      return resolvers.promise;
    },
    stream(data, observer) {
      const id = randomID();
      ongoingStreamObservers.set(id, observer);
      try {
        ensureActive();
        port.postMessage({ t: 's', i: id, d: data } satisfies Packet);
        return () => {
          if (!ongoingStreamObservers.has(id)) return;
          port.postMessage({ t: 's', i: id, d: null } satisfies Packet);
        };
      } catch (err) {
        queueMicrotask(() => {
          observer.error?.(err);
        });
        return noop;
      }
    },
    dispose,
  };

  if (process.env.NODE_ENV === 'test') {
    Object.assign(messaging, {
      ongoingRequestResolvers,
      ongoingStreamObservers,
    });
  }

  return messaging;
}

export function fromMessagePort(port: MessagePort): Port {
  return {
    name: randomID(),
    postMessage: port.postMessage.bind(port),
    onMessage(listener) {
      const ac = new AbortController();
      port.addEventListener('message', (ev) => listener(ev.data), { signal: ac.signal });
      return ac.abort.bind(ac);
    },
    onDispose() {
      return noop;
    },
  };
}

export function fromChromePort(portResolver: chrome.runtime.Port | (() => chrome.runtime.Port)): Port {
  const getPort = () => (typeof portResolver === 'function' ? portResolver() : portResolver);
  return {
    name: getPort().name,
    postMessage: (message) => getPort().postMessage(message),
    onMessage(listener) {
      const port = getPort();
      port.onMessage.addListener(listener);
      return () => {
        port.onMessage.removeListener(listener);
      };
    },
    onDispose(listener) {
      const port = getPort();
      port.onDisconnect.addListener(listener);
      return () => {
        port.onDisconnect.removeListener(listener);
      };
    },
  };
}
