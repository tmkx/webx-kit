import type { Promisable, Observer } from 'type-fest';
import { randomID, withResolvers } from './utils';

export type SendMessageFunction = (message: any) => void;
export type CleanupFunction = VoidFunction;

export interface Port {
  name?: string;
  onMessage(listener: (message: any, ...rest: unknown[]) => Promisable<any>): VoidFunction;
  send(message: any, originMessage?: [message: any, ...unknown[]]): void;
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

export type RequestHandler = (message: any) => Promisable<any>;
export type StreamHandler = (message: any, subscriber: Observer<any>) => Promisable<CleanupFunction | void>;

const INTERCEPT_ABORT = Symbol();

export interface CreateMessagingOptions {
  intercept?(data: unknown, abort: symbol): unknown | symbol;
  onRequest?: RequestHandler;
  onStream?: StreamHandler;
}

function isPacket(message: any): message is Packet {
  return typeof message === 'object' && message !== null && 't' in message && 'i' in message && 'd' in message;
}

function identity<T>(v: T) {
  return v;
}

function noop() {}

type PromiseResolvers<T> = ReturnType<typeof withResolvers<T>>;

export interface Messaging {
  name?: string;
  request(data: unknown): Promise<unknown>;
  stream(data: unknown, observer: Partial<Observer<any>>): VoidCallback;
  dispose(): void;
}

export function createMessaging(port: Port, options?: CreateMessagingOptions): Messaging {
  const { intercept = identity, onRequest, onStream } = options || {};
  // sender side
  const ongoingRequestResolvers = new Map<string, PromiseResolvers<any>>();
  const ongoingStreamObservers = new Map<string, Partial<Observer<any>>>();
  // receiver side
  const processingStreamCleanups = new Map<string, CleanupFunction | void>();

  async function handleMessage(...originMessage: [message: any, ...rest: unknown[]]) {
    const [message] = originMessage;

    if (!isPacket(message)) return;

    function reply(message: Packet) {
      port.send(message, originMessage);
    }

    switch (message.t) {
      case 'r': {
        if (!onRequest) return;
        const data = intercept(message.d, INTERCEPT_ABORT);
        if (data === INTERCEPT_ABORT) return;
        let d;
        try {
          const response = await onRequest(data);
          d = { data: response };
        } catch (err) {
          d = { error: err };
        }
        reply({ t: 'R', i: message.i, d });
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
        const data = intercept(message.d, INTERCEPT_ABORT);
        if (data === INTERCEPT_ABORT) return;

        function terminate(d: { error: unknown } | { complete: boolean }) {
          reply({ t: 'S', i: message.i, d });
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
            reply({ t: 'S', i: message.i, d: { next: value } });
          },
          error(error) {
            terminate({ error });
          },
          complete() {
            terminate({ complete: true });
          },
        };

        try {
          const cleanup = await onStream(data, observer);
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

  const offMessage = port.onMessage(handleMessage);

  const messaging: Messaging = {
    name: port.name,
    request<T>(data: unknown) {
      const resolvers = withResolvers<T>();
      const id = randomID();
      ongoingRequestResolvers.set(id, resolvers);
      try {
        port.send({ t: 'r', i: id, d: data } satisfies Packet);
      } catch (err) {
        resolvers.reject(err);
      }
      return resolvers.promise;
    },
    stream(data, observer) {
      const id = randomID();
      ongoingStreamObservers.set(id, observer);
      try {
        port.send({ t: 's', i: id, d: data } satisfies Packet);
        return () => {
          if (!ongoingStreamObservers.has(id)) return;
          port.send({ t: 's', i: id, d: null } satisfies Packet);
        };
      } catch (err) {
        queueMicrotask(() => {
          observer.error?.(err);
        });
        return noop;
      }
    },
    dispose() {
      offMessage();
    },
  };

  if (process.env.NODE_ENV === 'test') {
    Object.assign(messaging, {
      ongoingRequestResolvers,
      ongoingStreamObservers,
    });
  }

  return messaging;
}
