import type { Promisable, Observer } from 'type-fest';
import { randomID, withResolvers } from './utils';

export type SendMessageFunction = (message: any) => void;
export type CleanupFunction = VoidFunction;

export interface Port {
  name: string;
  postMessage: SendMessageFunction;
  onMessage: (listener: SendMessageFunction) => CleanupFunction;
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

export interface RequestMessage {
  name: string;
  data: any;
}

export interface StreamMessage {
  name: string;
  data: any;
}

export interface RequestContext {
  relay: (to: Messaging) => Promisable<any>;
}

export interface StreamContext {
  relay: (to: Messaging) => Promisable<any>;
}

export interface CreateMessagingOptions {
  onRequest?: (this: RequestContext, message: RequestMessage) => Promisable<any>;
  onStream?: (
    this: StreamContext,
    message: StreamMessage,
    subscriber: Observer<any>
  ) => Promisable<CleanupFunction | void>;
  onEvent?: (message: any) => any;
  onDispose?: VoidCallback;
  on?: (message: any) => any;
}

function isPacket(message: any): message is Packet {
  return typeof message === 'object' && message !== null && 't' in message && 'i' in message && 'd' in message;
}

type PromiseResolvers<T> = ReturnType<typeof withResolvers<T>>;

export interface Messaging {
  name: string;
  request: <T>(name: string, data: unknown) => Promise<T>;
  stream: (name: string, data: unknown, observer: Partial<Observer<any>>) => VoidCallback;
  dispose: VoidFunction;
}

export function createMessaging(port: Port, options?: CreateMessagingOptions): Messaging {
  const { on, onRequest, onStream } = options || {};
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
              return to.request(message.d.name, message.d.data);
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
        function terminate(d?: { error: unknown } | { complete: boolean }) {
          d && port.postMessage({ t: 'S', i: message.i, d } satisfies Packet);
          processingStreamCleanups.get(message.i)?.();
          processingStreamCleanups.delete(message.i);
        }

        // sending again means "unsubscribe"
        if (processingStreamCleanups.has(message.i)) {
          terminate();
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
              return to.stream(message.d.name, message.d.data, observer);
            },
          };
          const cleanup = await onStream.call(context, message.d, observer);
          processingStreamCleanups.set(message.i, cleanup);
        } catch (error) {
          terminate({ error });
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
          observer.complete?.();
          ongoingStreamObservers.delete(message.i);
        }
        break;
      }
    }
  }

  const offMessage = port.onMessage(handleMessage);

  return {
    name: port.name,
    request<T>(name: string, data: unknown) {
      const resolvers = withResolvers<T>();
      const id = randomID();
      ongoingRequestResolvers.set(id, resolvers);
      port.postMessage({ t: 'r', i: id, d: { name, data } } satisfies Packet);
      return resolvers.promise;
    },
    stream(name, data, observer) {
      const id = randomID();
      ongoingStreamObservers.set(id, observer);
      port.postMessage({ t: 's', i: id, d: { name, data } } satisfies Packet);
      return () => {
        if (!ongoingStreamObservers.has(id)) return;
        port.postMessage({ t: 's', i: id, d: null } satisfies Packet);
        ongoingStreamObservers.delete(id);
      };
    },
    dispose() {
      offMessage();
    },
  };
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
  };
}
