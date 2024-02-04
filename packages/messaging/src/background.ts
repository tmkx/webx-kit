import { AnyTRPCRouter } from '@trpc/server';
import { Port, RequestHandler, StreamHandler, createMessaging } from './core';
import { applyMessagingHandler } from './core/trpc';
import { WebxMessage, isWebxMessage } from './shared';

export interface CustomHandlerOptions {
  requestHandler?: RequestHandler;
  streamHandler?: StreamHandler;
}

const NAME = 'background';

const backgroundPort: Port = {
  name: NAME,
  onMessage(listener) {
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  },
  send(message, originMessage?: Parameters<Parameters<typeof chrome.runtime.onMessage.addListener>[0]>) {
    if (!originMessage) return chrome.runtime.sendMessage(message);
    const [, sender] = originMessage;
    if (!sender.tab?.id) return chrome.runtime.sendMessage(message);
    return chrome.tabs.sendMessage(sender.tab.id, message, { documentId: sender.documentId, frameId: sender.frameId });
  },
};

function shouldSkip(data: unknown) {
  if (!isWebxMessage(data)) return true;
  return !(!data.to || data.to === NAME);
}

export function createCustomHandler({ requestHandler, streamHandler }: CustomHandlerOptions) {
  return createMessaging(backgroundPort, {
    intercept: (data: WebxMessage, abort) => (shouldSkip(data) ? abort : data.data),
    onRequest: requestHandler || (() => Promise.reject()),
    onStream:
      streamHandler ||
      ((_, subscriber) => {
        subscriber.error('unimplemented');
      }),
  });
}

export interface TrpcHandlerOptions<TRouter extends AnyTRPCRouter> {
  router: TRouter;
}

export function createTrpcHandler<TRouter extends AnyTRPCRouter>({ router }: TrpcHandlerOptions<TRouter>) {
  return applyMessagingHandler({
    port: backgroundPort,
    router,
    intercept: (data: WebxMessage, abort) => (shouldSkip(data) ? abort : data.data),
  });
}
