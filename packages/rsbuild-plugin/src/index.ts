import { RsbuildConfig, RsbuildPlugin } from '@rsbuild/shared';

export interface WebxPluginOptions {}

function getDefaultConfig(): RsbuildConfig {
  return {
    dev: {
      writeToDisk: true,
    },
  };
}

export const webxPlugin = (options: WebxPluginOptions = {}): RsbuildPlugin => {
  return {
    name: '@webx-kit/rsbuild-plugin',
    setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(getDefaultConfig(), config);
      });
    },
  };
};
