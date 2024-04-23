import type { LiteralUnion, Observer } from 'type-fest';
import type { Messaging } from './core';

export type ClientType = 'default' | 'devtools' | 'popup' | 'options' | 'content-script';

export type MessageTarget = LiteralUnion<ClientType, string> | number;

export type RequestHandler = (message: WebxMessage) => any;
export type StreamHandler = (message: WebxMessage, subscriber: Observer<any>) => any;

export interface WebxMessage {
  /** Target */
  to?: MessageTarget;
  /** Structural cloneable data */
  data: unknown;
}

export function isWebxMessage(message: unknown): message is WebxMessage {
  return typeof message === 'object' && message !== null && 'data' in message;
}

export function wrapMessaging(messaging: Messaging) {
  return {
    request(data: unknown) {
      return messaging.request({ data } satisfies WebxMessage);
    },
    stream(data: unknown, observer: Partial<Observer<any>>) {
      return messaging.stream({ data } satisfies WebxMessage, observer);
    },
    requestTo(to: MessageTarget, data: unknown) {
      return messaging.request({ data, to } satisfies WebxMessage);
    },
    streamTo(to: MessageTarget, data: unknown, observer: Partial<Observer<any>>) {
      return messaging.stream({ data, to } satisfies WebxMessage, observer);
    },
    dispose: messaging.dispose,
  };
}

export type WrappedMessaging = ReturnType<typeof wrapMessaging>;
