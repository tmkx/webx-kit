import { createTrpcHandler } from '@webx-kit/messaging/background';
import { appRouter } from './router';

createTrpcHandler({
  router: appRouter,
});
