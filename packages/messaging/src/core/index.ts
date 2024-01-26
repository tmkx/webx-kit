import type { Promisable } from 'type-fest';
import { randomID, withResolvers } from './utils';

export type SendMessageFunction = (message: any) => void;

export interface Port {
  postMessage: SendMessageFunction;
  onMessage: (listener: SendMessageFunction) => VoidFunction;
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

export interface CreateMessagingOptions {
  onRequest?: (message: RequestMessage) => Promisable<any>;
  onStream?: (message: any) => any;
  onEvent?: (message: any) => any;
  on?: (message: any) => any;
}

function isPacket(message: any): message is Packet {
  return typeof message === 'object' && message !== null && 't' in message && 'i' in message && 'd' in message;
}

type PromiseResolvers<T> = ReturnType<typeof withResolvers<T>>;

export function createMessaging(port: Port, options?: CreateMessagingOptions) {
  const { on, onRequest } = options || {};
  const ongoingRequestResolvers = new Map<string, PromiseResolvers<any>>();

  async function handleMessage(message: any) {
    on?.(message);
    if (!isPacket(message)) return;
    switch (message.t) {
      case 'r': {
        if (!onRequest) throw new Error('unimplemented');
        let d;
        try {
          const response = await onRequest(message.d);
          d = { data: response };
        } catch (err) {
          d = { error: err };
        }
        port.postMessage({ t: 'R', i: message.i, d } satisfies Packet);
        break;
      }
      case 'R': {
        const resolvers = ongoingRequestResolvers.get(message.i);
        if (!resolvers) throw new Error('no resolvers');
        const data = message.d;

        if ('data' in data) resolvers.resolve(data.data);
        else resolvers.reject(data.error);

        ongoingRequestResolvers.delete(message.i);
        break;
      }
    }
  }

  const offMessage = port.onMessage(handleMessage);

  return {
    request<T>(name: string, data: unknown) {
      const resolvers = withResolvers<T>();
      const id = randomID();
      ongoingRequestResolvers.set(id, resolvers);
      port.postMessage({ t: 'r', i: id, d: { name, data } } satisfies Packet);
      return resolvers.promise;
    },
    dispose() {
      offMessage();
    },
  };
}

export function fromMessagePort(port: MessagePort): Port {
  return {
    postMessage: port.postMessage.bind(port),
    onMessage(listener) {
      const ac = new AbortController();
      port.addEventListener('message', (ev) => listener(ev.data), { signal: ac.signal });
      return ac.abort.bind(ac);
    },
  };
}
