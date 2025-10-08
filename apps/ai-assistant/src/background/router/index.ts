import { t } from '@webx-kit/messaging/server';
import * as z from 'zod';
import { getGenAI } from '@/background/shared';

export const appRouter = t.router({
  generateContentStream: t.procedure
    .input(z.object({ prompt: z.string() })) //
    .subscription(async function* ({ input, signal }) {
      const genAI = await getGenAI();

      if (!genAI) {
        chrome.runtime.openOptionsPage();
        throw new Error('GenAI is not initialized');
      }
      const result = await genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }).generateContentStream(
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: input.prompt }],
            },
          ],
        },
        {
          signal,
        }
      );

      for await (const token of result.stream || []) {
        if (signal?.aborted) break;
        yield token.text();
      }
    }),
});

export type AppRouter = typeof appRouter;
