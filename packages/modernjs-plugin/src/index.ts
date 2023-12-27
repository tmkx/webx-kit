import { AppTools, CliPlugin, UserConfig, mergeConfig, webpack as webpackNS } from '@modern-js/app-tools';
import { WebpackChain } from '@modern-js/utils';
import { BackgroundOptions, backgroundPlugin, getBackgroundEntryNames } from './builder-plugins/background';
import {
  ContentScriptsOptions,
  contentScriptsPlugin,
  getContentScriptEntryNames,
} from './builder-plugins/content-scripts';
import { hmrCorsPlugin } from './builder-plugins/hmr-cors';
import { ManifestOptions, manifestPlugin } from './builder-plugins/manifest';

export { isDev, isProd } from '@modern-js/utils';

export type { BackgroundEntry } from './builder-plugins/background';
export type { ContentScriptEntry } from './builder-plugins/content-scripts';

export interface WebxPluginOptions extends BackgroundOptions, ContentScriptsOptions, ManifestOptions {}

const getDefaultConfig = ({ allInOneEntries }: { allInOneEntries: Set<string> }): UserConfig<AppTools<'webpack'>> => {
  return {
    source: {
      entriesDir: './src/pages',
    },
    dev: {
      assetPrefix: true,
    },
    html: {
      disableHtmlFolder: true,
    },
    output: {
      disableInlineRuntimeChunk: true, // inline scripts are not allowed in MV3
      disableFilenameHash: true,
      distPath: {
        html: '.',
      },
    },
    tools: {
      devServer: {
        client: {
          protocol: 'ws',
          host: 'localhost',
        },
      },
      webpackChain(chain: WebpackChain) {
        // DO NOT split chunks when the entry is background/content-scripts
        chain.optimization.runtimeChunk(false).splitChunks({
          chunks: (chunk) => !allInOneEntries.has(chunk.getEntryOptions()?.name!),
        });
        chain.experiments({ outputModule: true });
      },
    },
  };
};

export const webxPlugin = (options: WebxPluginOptions = {}): CliPlugin<AppTools<'shared'>> => {
  return {
    name: '@webx-kit/modernjs-plugin',
    post: ['@modern-js/app-tools'],
    setup(api) {
      const config = api.useConfigContext();

      const allInOneEntries = new Set([...getBackgroundEntryNames(options), ...getContentScriptEntryNames(options)]);
      const defaultConfig = getDefaultConfig({ allInOneEntries });
      Object.assign(config, mergeConfig([defaultConfig, config]));

      (config.builderPlugins ??= []).push(
        backgroundPlugin(options),
        contentScriptsPlugin(options),
        hmrCorsPlugin(),
        manifestPlugin(options)
      );
    },
  };
};
