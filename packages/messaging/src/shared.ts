export const NAMESPACE = 'webx:';

export type ClientType = 'devtools' | 'popup' | 'options' | 'content-script';

export interface WebxMessage {
  /** Message ID */
  id: string;
  /** Source ID */
  from: string;
  /** Source tab ID */
  tabId?: number;
  /** Target */
  to?: string;
  /** Structural cloneable data */
  data: unknown;
}

export type WebxMessageListener = (message: WebxMessage) => void;

export function isWebxMessage(message: unknown): message is WebxMessage {
  return typeof message === 'object' && message !== null && 'id' in message && 'from' in message && 'data' in message;
}
