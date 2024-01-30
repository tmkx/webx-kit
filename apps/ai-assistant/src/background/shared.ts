import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKeyAtom } from '@/hooks/atoms/config';
import { atom, getDefaultStore } from 'jotai';

export const store = getDefaultStore();

const genAIAtom = atom(async (get) => {
  const apiKey = await get(apiKeyAtom);
  return apiKey ? new GoogleGenerativeAI(apiKey) : null;
});

export let genAI: GoogleGenerativeAI | null = null;
const updateGenAIInstance = () => store.get(genAIAtom).then((instance) => (genAI = instance));
updateGenAIInstance();
store.sub(genAIAtom, updateGenAIInstance);
