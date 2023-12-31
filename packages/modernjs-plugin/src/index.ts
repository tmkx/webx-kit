import path from 'node:path';
import { AppTools, CliPlugin, UserConfig, mergeConfig } from '@modern-js/app-tools';
import { WebpackChain, isDev } from '@modern-js/utils';
import { BackgroundOptions, backgroundPlugin, getBackgroundEntryNames } from './plugins/background';
import { ContentScriptsOptions, contentScriptsPlugin, getContentScriptEntryNames } from './plugins/content-scripts';
import { CleanOptions, cleanPlugin } from './plugins/clean';
import { hmrCorsPlugin } from './plugins/hmr-cors';
import { ManifestOptions, manifestPlugin } from './plugins/manifest';

export { isDev, isProd } from '@modern-js/utils';

export type { BackgroundEntry } from './plugins/background';
export type { ContentScriptEntry } from './plugins/content-scripts';

export interface WebxPluginOptions extends BackgroundOptions, ContentScriptsOptions, CleanOptions, ManifestOptions {}

const getDefaultConfig = ({ allInOneEntries }: { allInOneEntries: Set<string> }): UserConfig<AppTools<'webpack'>> => {
  return {
    source: {
      entriesDir: './src/pages',
      define: {
        __DEV__: isDev(),
      },
      include: [path.resolve(__dirname, './runtime.ts')],
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
      disableSourceMap: !isDev(),
      distPath: {
        html: '.',
      },
      polyfill: 'off',
    },
    tools: {
      devServer: {
        client: {
          protocol: 'ws',
          host: 'localhost',
        },
      },
      webpackChain(chain: WebpackChain) {
        chain.experiments({ outputModule: true });
        // DO NOT split chunks when the entry is background/content-scripts
        chain.optimization.runtimeChunk(false).splitChunks({
          chunks: (chunk) => !allInOneEntries.has(chunk.getEntryOptions()?.name!),
        });
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
        cleanPlugin(options),
        hmrCorsPlugin(),
        manifestPlugin(options)
      );
    },
  };
};
