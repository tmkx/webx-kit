import { createTrpcHandler } from '@webx-kit/messaging/background';
import { appRouter } from './router';

// @ts-expect-error debugging purpose
globalThis.__handler = createTrpcHandler({
  router: appRouter,
});
