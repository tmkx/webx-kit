import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import { getGenAI } from '@/background/shared';

const t = initTRPC.create({ isServer: true });

export const appRouter = t.router({
  generateContentStream: t.procedure.input(z.object({ prompt: z.string() })).subscription(({ input }) => {
    return observable((observer) => {
      let isUnsubscribed = false;

      getGenAI().then((genAI) => {
        if (!genAI) {
          chrome.runtime.openOptionsPage();
          return observer.error('GenAI is not initialized');
        }
        genAI
          .getGenerativeModel({ model: 'gemini-pro' })
          .generateContentStream({
            contents: [
              {
                role: 'user',
                parts: [{ text: input.prompt }],
              },
            ],
          })
          .then(async (result) => {
            for await (const token of result.stream || []) {
              if (isUnsubscribed) break;
              observer.next(token.text());
            }
            observer.complete();
          })
          .catch(observer.error);
      });

      return () => {
        isUnsubscribed = true;
      };
    });
  }),
});

export type AppRouter = typeof appRouter;
