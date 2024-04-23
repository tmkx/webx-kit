import { createTrpcServer } from '@webx-kit/messaging/server';
import { appRouter } from './router';

// @ts-expect-error debugging purpose
globalThis.__handler = createTrpcServer({
  router: appRouter,
});
