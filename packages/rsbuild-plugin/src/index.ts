import { RsbuildConfig, RsbuildPlugin } from '@rsbuild/shared';
import { ManifestOptions, applyManifestSupport } from './plugins/manifest';

export interface WebxPluginOptions extends ManifestOptions {}

function getDefaultConfig(): RsbuildConfig {
  return {
    dev: {
      writeToDisk: true,
    },
    output: {
      disableFilenameHash: true,
    },
    server: {
      publicDir: false,
    },
  };
}

export const webxPlugin = (options: WebxPluginOptions = {}): RsbuildPlugin => {
  return {
    name: '@webx-kit/rsbuild-plugin',
    setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, getDefaultConfig());
      });
      applyManifestSupport(api, options);
    },
  };
};
