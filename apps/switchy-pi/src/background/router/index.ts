import { initTRPC } from '@trpc/server';

const t = initTRPC.create({ isServer: true });

export const appRouter = t.router({
  ping: t.procedure.query(() => 'pong'),
});

export type AppRouter = typeof appRouter;
