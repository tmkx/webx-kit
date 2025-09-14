import type { Promisable } from 'type-fest';
import type { Observer } from 'type-fest/globals';
import { randomID, withResolvers } from './utils';

export type SendMessageFunction = (message: any) => void;
export type CleanupFunction = VoidFunction;

export type OriginMessage = [message: any, ...rest: unknown[]];

export interface Port {
  name?: string;
  onMessage(listener: (message: any, ...rest: unknown[]) => Promisable<any>): VoidFunction;
  send(message: any, originMessage?: OriginMessage): Promise<unknown>;
}

interface AnyPacket {
  /**
   * Packet type
   */
  t: string;

  /**
   * ID
   */
  i: string;

  /**
   * Data
   */
  d: unknown;
}

interface RequestPacket extends AnyPacket {
  t: 'r';
  d: any;
}

interface ResponsePacket extends AnyPacket {
  t: 'R';
  d: { data: unknown } | { error: unknown };
}

interface StreamPacket extends AnyPacket {
  t: 's';
  d: any;
}

interface StreamDataPacket extends AnyPacket {
  t: 'S';
  d:
    | { next: unknown }
    | { error: unknown }
    | {
        /**
         * true: by calling `.complete()`
         * false: unsubscribe
         */
        complete: boolean;
      };
}

/**
 * @private
 */
type Packet = RequestPacket | ResponsePacket | StreamPacket | StreamDataPacket;

export type RequestHandler = (
  message: any,
  context: {
    signal: AbortSignal;
    originMessage: OriginMessage;
  }
) => Promisable<any>;
export type StreamHandler = (
  message: any,
  subscriber: Observer<any>,
  context: {
    signal: AbortSignal;
    originMessage: OriginMessage;
  }
) => Promisable<CleanupFunction | void>;

const INTERCEPT_ABORT = Symbol();

const ABORT_MESSAGE = '__INTERNAL_ABORT__';

function createAbortPacket(t: 'r' | 's', i: string): Packet {
  return { t, i, d: { [ABORT_MESSAGE]: true } };
}

function isAbortPacket({ d }: RequestPacket | StreamPacket): boolean {
  return !!d && ABORT_MESSAGE in d;
}

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

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface Messaging {
  name?: string;
  request(data: unknown, options?: RequestOptions): Promise<unknown>;
  stream(data: unknown, observer: Partial<Observer<any>>): VoidFunction;
  dispose(): void;
}

export function createMessaging(port: Port, options?: CreateMessagingOptions): Messaging {
  const { intercept = identity, onRequest, onStream } = options || {};
  // sender side
  const ongoingRequestResolvers = new Map<string, PromiseResolvers<any>>();
  const ongoingStreamObservers = new Map<string, Partial<Observer<any>>>();
  // receiver side
  const processingAbortControllers = new Map<string, AbortController>();
  const processingStreamCleanups = new Map<string, CleanupFunction | void>();

  async function handleMessage(...originMessage: OriginMessage) {
    const [message] = originMessage;

    if (!isPacket(message)) return;

    function reply(message: ResponsePacket | StreamDataPacket) {
      return port.send(message, originMessage);
    }

    switch (message.t) {
      case 'r': {
        if (!onRequest) return;
        const { i: messageId } = message;
        let data = message.d;
        if (isAbortPacket(message) || (data = intercept(message.d, INTERCEPT_ABORT)) === INTERCEPT_ABORT) {
          const ac = processingAbortControllers.get(messageId);
          if (ac) {
            processingAbortControllers.delete(messageId);
            ac.abort();
          }
          break;
        }

        let d: ResponsePacket['d'];
        try {
          const ac = new AbortController();
          processingAbortControllers.set(messageId, ac);
          const response = await onRequest(data, { signal: ac.signal, originMessage });
          d = { data: response };
        } catch (err) {
          d = { error: err };
          processingAbortControllers.delete(messageId);
        }
        reply({ t: 'R', i: messageId, d }).finally(() => {
          processingAbortControllers.delete(messageId);
        });
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
        let data = message.d;

        function safelyTerminate(d: { error: unknown } | { complete: boolean }) {
          reply({ t: 'S', i: message.i, d }).catch(noop);
          const ac = processingAbortControllers.get(message.i);
          if (ac) {
            processingAbortControllers.delete(message.i);
            ac.abort();
          }
          const cleanupFn = processingStreamCleanups.get(message.i);
          processingStreamCleanups.delete(message.i);
          cleanupFn && cleanupFn();
        }

        if (isAbortPacket(message) || (data = intercept(message.d, INTERCEPT_ABORT)) === INTERCEPT_ABORT) {
          safelyTerminate({ complete: false });
          break;
        }

        const observer: Observer<any> = {
          next(value) {
            reply({ t: 'S', i: message.i, d: { next: value } }).catch((error) => {
              safelyTerminate({ error });
            });
          },
          error(error) {
            safelyTerminate({ error });
          },
          complete() {
            safelyTerminate({ complete: true });
          },
        };

        try {
          const ac = new AbortController();
          processingAbortControllers.set(message.i, ac);
          const cleanup = await onStream(data, observer, { signal: ac.signal, originMessage });
          processingStreamCleanups.set(message.i, cleanup);
        } catch (error) {
          // Error is not serializable in `chrome.runtime.Port`
          safelyTerminate({ error: error instanceof Error ? error.message : error });
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
          ongoingStreamObservers.delete(message.i);
          observer.error?.(data.error);
        } else if ('complete' in data) {
          ongoingStreamObservers.delete(message.i);
          data.complete && observer.complete?.();
        }
        break;
      }
    }
  }

  const offMessage = port.onMessage(handleMessage);

  const messaging: Messaging = {
    name: port.name,
    request<T>(data: unknown, options?: RequestOptions) {
      const { signal } = options || {};
      const resolvers = withResolvers<T>();
      const id = randomID();
      ongoingRequestResolvers.set(id, resolvers);
      if (signal) {
        if (signal.aborted) return Promise.reject(signal.reason);
        signal.addEventListener('abort', () => {
          if (!ongoingRequestResolvers.has(id)) return;
          ongoingRequestResolvers.delete(id);
          resolvers.reject(signal.reason);
          port.send(createAbortPacket('r', id)).catch(noop);
        });
      }
      port.send({ t: 'r', i: id, d: data } satisfies Packet).catch((err) => {
        resolvers.reject(err);
      });
      return resolvers.promise;
    },
    stream(data, observer) {
      const id = randomID();
      ongoingStreamObservers.set(id, observer);
      port.send({ t: 's', i: id, d: data } satisfies Packet).catch((err) => {
        queueMicrotask(() => {
          observer.error?.(err);
        });
      });
      return () => {
        if (!ongoingStreamObservers.has(id)) return;
        port.send(createAbortPacket('s', id)).catch(noop);
      };
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
