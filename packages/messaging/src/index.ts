import { isBackground } from './env';

export const id = crypto.randomUUID();

export function hello() {
  return 'world';
}

console.log('isBackground', isBackground);
