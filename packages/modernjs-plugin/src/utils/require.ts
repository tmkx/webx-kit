// @ts-ignore ts source check
import createJITI from '@rsbuild/shared/jiti';

export async function evalFile<T>(filepath: string): Promise<T> {
  return await createJITI(__filename, { requireCache: false, interopDefault: true })(filepath);
}
