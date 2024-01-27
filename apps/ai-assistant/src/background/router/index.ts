import { GoogleGenerativeAI } from '@google/generative-ai';
import { setStreamHandler } from '@webx-kit/messaging/background';
import { apiKeyAtom } from '@/hooks/atoms/config';
import { atom, getDefaultStore } from 'jotai';

const store = getDefaultStore();

const genAIAtom = atom(async (get) => {
  const apiKey = await get(apiKeyAtom);
  return apiKey ? new GoogleGenerativeAI(apiKey) : null;
});

store.sub(genAIAtom, () => {});

setStreamHandler(async (message, subscriber) => {
  const { data } = message;
  if (data && typeof data === 'object' && 'prompt' in data && typeof data.prompt === 'string') {
    const genAI = await store.get(genAIAtom);
    if (!genAI) return subscriber.error('GenAI is not initialized');
    const result = await genAI.getGenerativeModel({ model: 'gemini-pro' }).generateContentStream({
      contents: [
        {
          role: 'user',
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
