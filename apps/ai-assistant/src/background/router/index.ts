import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import { genAI } from '@/background/shared';

const t = initTRPC.create();

export const appRouter = t.router({
  generateContentStream: t.procedure.input(z.object({ prompt: z.string() })).subscription(({ input }) => {
    return observable((observer) => {
      if (!genAI) return observer.error('GenAI is not initialized');
      let isUnsubscribed = false;
      (async () => {
        const result = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContentStream({
          contents: [
            {
              role: 'user',
              parts: [{ text: input.prompt }],
            },
          ],
        });
        for await (const token of result.stream || []) {
          if (isUnsubscribed) break;
          observer.next(token.text());
        }
        observer.complete();
      })();
      return () => {
        isUnsubscribed = true;
      };
    });
  }),
});

export type AppRouter = typeof appRouter;
