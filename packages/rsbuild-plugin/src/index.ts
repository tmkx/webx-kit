import { RsbuildConfig, RsbuildPlugin, isDev } from '@rsbuild/shared';
import { BackgroundOptions, applyBackgroundSupport, getBackgroundEntryNames } from '@webx-kit/core-plugin/background';
import {
  ContentScriptsOptions,
  applyContentScriptsSupport,
  getContentScriptEntryNames,
} from '@webx-kit/core-plugin/content-script';
import { ManifestOptions, applyManifestSupport } from '@webx-kit/core-plugin/manifest';
import type { JsChunk } from './utils/types';
import { BackgroundReloadPlugin } from './plugins/background/live-reload-plugin';
import { ContentScriptHMRPlugin } from './plugins/content-script/hmr-plugin';
import { ContentScriptPublicPathPlugin } from './plugins/content-script/public-path-plugin';
import { ContentScriptShadowRootPlugin } from './plugins/content-script/shadow-root-plugin';

export interface WebxPluginOptions extends BackgroundOptions, ContentScriptsOptions, ManifestOptions {}

function getDefaultConfig({ allInOneEntries }: { allInOneEntries: Set<string> }): RsbuildConfig {
  return {
    source: {
      define: {
        __DEV__: isDev(),
      },
    },
    dev: {
      assetPrefix: true,
      client: {
        protocol: 'ws',
        host: 'localhost',
      },
      writeToDisk: (filename) => !filename.includes('.hot-update.'),
    },
    output: {
      distPath: {
        ...(process.env.WEBX_DIST ? { root: process.env.WEBX_DIST } : null),
      },
      filenameHash: false,
    },
    server: {
      publicDir: false,
      port: process.env.PORT ? Number(process.env.PORT) : undefined,
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
      const allInOneEntries = new Set([...getBackgroundEntryNames(options), ...getContentScriptEntryNames(options)]);
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const originalConfig = api.getRsbuildConfig('original');
        return mergeRsbuildConfig(config, getDefaultConfig({ allInOneEntries }), originalConfig);
      });
      applyBackgroundSupport(api, options, ({ entryName, backgroundLiveReload }) =>
        isDev() ? [new BackgroundReloadPlugin(entryName, backgroundLiveReload)] : []
      );
      applyContentScriptsSupport(api, options, ({ contentScriptNames }) =>
        isDev()
          ? [new ContentScriptHMRPlugin(contentScriptNames), new ContentScriptShadowRootPlugin(contentScriptNames)]
          : [new ContentScriptPublicPathPlugin(contentScriptNames)]
      );
      applyManifestSupport(api, options);
    },
  };
};
