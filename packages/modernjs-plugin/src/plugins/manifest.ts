import { isDev } from '@modern-js/utils';
import { evalFile } from '../utils';
import { BuilderPlugin } from '../types';

export type ManifestOptions = {
  /**
   * manifest source file path
   *
   * @default `./src/manifest.ts`
   */
  manifest?: string;
};

const DEFAULT_MANIFEST_SRC = './src/manifest.ts';

export const manifestPlugin = (options: ManifestOptions): BuilderPlugin => {
  return {
    name: '@webx-kit/modernjs-plugin/manifest',
    async setup(api) {
      api.modifyBuilderConfig((config) => {
        config.output ??= {};
        config.output.copy ??= [];
        const copyPatterns = Array.isArray(config.output.copy) ? config.output.copy : config.output.copy.patterns;
        copyPatterns.push({
          from: options.manifest || DEFAULT_MANIFEST_SRC,
          to: './manifest.json',
          async transform(_input, filename) {
            const {
              mod: { default: manifest },
            } = await evalFile<{ default: unknown }>(filename);
            return isDev() ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
          },
        });
      });
    },
  };
};
