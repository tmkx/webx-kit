import { LiteralUnion } from 'type-fest';

export const NAMESPACE = 'webx:';

export type ClientType = 'devtools' | 'popup' | 'options' | 'content-script';

export type MessageTarget = LiteralUnion<ClientType, string>;

export type MessageType = 'promise' | 'subscription';
export type MessageCommand = 'next' | 'error' | 'complete';

export interface WebxMessage {
  /** Message ID */
  id: string;
  /** Source ID */
  from?: string;
  /** Source tab ID */
  tabId?: number;
  /** Target */
  to?: MessageTarget;
  type?: MessageType;
  cmd?: MessageCommand;
  /** Structural cloneable data */
  data: unknown;
}

export type WebxMessageListener = (message: WebxMessage, subscriber: MessageSubscriber<unknown>) => void;

export interface MessageSubscriber<T> {
  next: (value: T) => void;
  error: (reason?: any) => void;
  complete: () => void;
  reply: (value: T) => void;
}

export function isWebxMessage(message: unknown): message is WebxMessage {
  return typeof message === 'object' && message !== null && 'id' in message && 'data' in message;
}

export function randomID() {
  return Math.random().toString(36).slice(2);
}

export function withResolvers<T = unknown>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export class TimeoutError extends Error {
  name = 'TimeoutError';
}

export interface SendOptions {
  type?: MessageType;
  cmd?: MessageCommand;
  to?: string;
  id?: string;
}

export type SendFn = (data: unknown, options?: SendOptions) => void;

function noop() {}

const noopSubscriber: MessageSubscriber<unknown> = {
  next: noop,
  error: noop,
  complete: noop,
  reply: noop,
};

export function createSubscriber<T>(message: WebxMessage, send: SendFn): MessageSubscriber<T> {
  if (!message.type || !message.from) return noopSubscriber;
  const options: SendOptions = {
    id: message.id,
    to: message.from,
  };
  const next = (data: T) => {
    send(data, { ...options, cmd: 'next' });
  };
  const error = (reason?: any) => {
    send(reason, { ...options, cmd: 'error' });
  };
  const complete = () => {
    send(null, { ...options, cmd: 'complete' });
  };
  const reply = (data: T) => {
    send(data, { ...options, cmd: 'complete' });
  };
  return {
    next,
    error,
    complete,
    reply,
  };
}
