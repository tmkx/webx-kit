import type { LiteralUnion } from 'type-fest';
import type { Observer } from 'type-fest/globals';
import type { Messaging } from './core';

export type ClientType = 'default' | 'devtools' | 'popup' | 'options' | 'content-script';

export type MessageTarget = LiteralUnion<ClientType, string> | number;

export type RequestHandler = (message: WebXMessage) => any;
export type StreamHandler = (message: WebXMessage, subscriber: Observer<any>) => any;

export interface WebXMessage {
  /** Target */
  to?: MessageTarget;
  /** Structural cloneable data */
  data: unknown;
}

export function isWebXMessage(message: unknown): message is WebXMessage {
  return typeof message === 'object' && message !== null && 'data' in message;
}

export function wrapMessaging(messaging: Messaging) {
  return {
    request(data: unknown) {
      return messaging.request({ data } satisfies WebXMessage);
    },
    stream(data: unknown, observer: Partial<Observer<any>>) {
      return messaging.stream({ data } satisfies WebXMessage, observer);
    },
    requestTo(to: MessageTarget, data: unknown) {
      return messaging.request({ data, to } satisfies WebXMessage);
    },
    streamTo(to: MessageTarget, data: unknown, observer: Partial<Observer<any>>) {
      return messaging.stream({ data, to } satisfies WebXMessage, observer);
    },
    dispose: messaging.dispose,
  };
}

export type WrappedMessaging = ReturnType<typeof wrapMessaging>;
