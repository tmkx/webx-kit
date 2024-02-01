import { bundleRequire } from 'bundle-require';

export async function evalFile<T>(filepath: string) {
  return await bundleRequire<T>({ filepath });
}
