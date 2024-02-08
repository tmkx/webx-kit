import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKeyAtom } from '@/hooks/atoms/config';
import { atom, getDefaultStore } from 'jotai';

export const store = getDefaultStore();

const genAIAtom = atom(async (get) => {
  const apiKey = await get(apiKeyAtom);
  return apiKey ? new GoogleGenerativeAI(apiKey) : null;
});

let genAI: Promise<GoogleGenerativeAI | null> = Promise.resolve(null);
const updateGenAIInstance = () => (genAI = store.get(genAIAtom));
updateGenAIInstance();
store.sub(genAIAtom, updateGenAIInstance);

export function getGenAI() {
  return genAI;
}
