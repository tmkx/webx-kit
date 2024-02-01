import { RsbuildConfig, RsbuildPlugin } from '@rsbuild/shared';
import { BackgroundOptions, applyBackgroundSupport } from './plugins/background';
import { ManifestOptions, applyManifestSupport } from './plugins/manifest';
import { JsChunk } from './utils/types';

export interface WebxPluginOptions extends BackgroundOptions, ManifestOptions {}

function getDefaultConfig({ allInOneEntries }: { allInOneEntries: Set<string> }): RsbuildConfig {
  return {
    dev: {
      assetPrefix: true,
      client: {
        protocol: 'ws',
        host: 'localhost',
      },
      writeToDisk: (filename) => !/\.hot-update\.\w+$/.test(filename),
    },
    output: {
      disableFilenameHash: true,
    },
    server: {
      publicDir: false,
    },
    tools: {
      bundlerChain(chain) {
        // DO NOT split chunks when the entry is background/content-scripts
        chain.optimization.runtimeChunk(false).splitChunks({
          chunks: (chunk) => {
            const jsChunk = chunk as unknown as JsChunk;
            return jsChunk.runtime.every((runtime) => !allInOneEntries.has(runtime));
          },
        });
      },
    },
  };
}

export const webxPlugin = (options: WebxPluginOptions = {}): RsbuildPlugin => {
  return {
    name: '@webx-kit/rsbuild-plugin',
    setup(api) {
      const allInOneEntries = new Set(['background']);
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const originalConfig = api.getRsbuildConfig('original');
        return mergeRsbuildConfig(config, getDefaultConfig({ allInOneEntries }), originalConfig);
      });
      applyBackgroundSupport(api, options);
      applyManifestSupport(api, options);
    },
  };
};
