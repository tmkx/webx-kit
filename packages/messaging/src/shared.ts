import type { LiteralUnion, Observer } from 'type-fest';

export const NAMESPACE = 'webx:';

export type ClientType = 'devtools' | 'popup' | 'options' | 'content-script';

export type MessageTarget = LiteralUnion<ClientType, string>;

export type RequestHandler = (message: WebxMessage) => any;
export type StreamHandler = (message: WebxMessage, subscriber: Observer<any>) => any;

export interface WebxMessage {
  /** Source ID */
  from?: string;
  /** Source tab ID */
  tabId?: number;
  /** Target */
  to?: MessageTarget;
  /** Structural cloneable data */
  data: unknown;
}

export function isWebxMessage(message: unknown): message is WebxMessage {
  return typeof message === 'object' && message !== null && 'data' in message;
}
