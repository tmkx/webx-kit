export const NAMESPACE = 'webx:';

export type ClientType = 'devtools' | 'popup' | 'options' | 'content-script';

export interface WebxMessage {
  id: string;
  from: string;
  to?: string;
  data: unknown;
}

export function isWebxMessage(message: unknown): message is WebxMessage {
  return typeof message === 'object' && message !== null && 'id' in message && 'from' in message && 'data' in message;
}
