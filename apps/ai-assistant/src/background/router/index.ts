import { GoogleGenerativeAI } from '@google/generative-ai';
import { on } from '@webx-kit/messaging/background';
import { apiKeyAtom } from '@/hooks/atoms/config';
import { atom, getDefaultStore } from 'jotai';

const store = getDefaultStore();

const genAIAtom = atom(async (get) => {
  const apiKey = await get(apiKeyAtom);
  return apiKey ? new GoogleGenerativeAI(apiKey) : null;
});

store.sub(genAIAtom, () => {});

on(async (message, subscriber) => {
  const { data } = message;
  // @ts-expect-error
  if (data && typeof data === 'object' && data.type === 'stream') {
    const genAI = await store.get(genAIAtom);
    if (!genAI) return subscriber.error('GenAI is not initialized');
    const result = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContentStream({
      contents: [
        {
          role: 'user',
          // @ts-expect-error
          parts: [{ text: data.prompt }],
        },
      ],
    });
    for await (const token of result.stream || []) {
      subscriber.next(token.text());
    }
    subscriber.complete();
  }
});
