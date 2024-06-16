import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import { isDev } from '@rsbuild/shared';
import { BackgroundOptions, applyBackgroundSupport, getBackgroundEntryNames } from '@webx-kit/core-plugin/background';
import { applyBuildHttpSupport } from '@webx-kit/core-plugin/build-http';
import {
  ContentScriptsOptions,
  applyContentScriptsSupport,
  getContentScriptEntryNames,
  normalizeContentScriptsOptions,
} from '@webx-kit/core-plugin/content-script';
import { applyEnvSupport } from '@webx-kit/core-plugin/env';
import { ManifestOptions, applyManifestSupport } from '@webx-kit/core-plugin/manifest';
import { titleCase } from '@webx-kit/core-plugin/utils';
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
    html: {
      title: ({ entryName }) => titleCase(entryName),
    },
    server: {
      publicDir: false,
      port: process.env.PORT ? Number(process.env.PORT) : undefined,
      printUrls: false,
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
    name: 'webx:rsbuild-plugin',
    setup(api) {
      const normalizedOptions = normalizeContentScriptsOptions(options);
      const allInOneEntries = new Set([
        ...getBackgroundEntryNames(normalizedOptions),
        ...getContentScriptEntryNames(normalizedOptions),
      ]);
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const originalConfig = api.getRsbuildConfig('original');
        return mergeRsbuildConfig(config, getDefaultConfig({ allInOneEntries }), originalConfig);
      });
      applyBackgroundSupport(api, normalizedOptions, ({ entryName, backgroundLiveReload }) =>
        isDev() ? [new BackgroundReloadPlugin(entryName, backgroundLiveReload)] : []
      );
      applyBuildHttpSupport(api);
      applyContentScriptsSupport(api, normalizedOptions, ({ contentScriptNames }) =>
        isDev()
          ? [new ContentScriptHMRPlugin(contentScriptNames), new ContentScriptShadowRootPlugin(contentScriptNames)]
          : [new ContentScriptPublicPathPlugin(contentScriptNames)]
      );
      applyEnvSupport(api);
      applyManifestSupport(api, normalizedOptions);
    },
  };
};
