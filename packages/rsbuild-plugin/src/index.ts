import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import {
  type BackgroundOptions,
  applyBackgroundSupport,
  getBackgroundEntryNames,
} from '@webx-kit/core-plugin/background';
import { applyBuildHttpSupport } from '@webx-kit/core-plugin/build-http';
import {
  type ContentScriptsOptions,
  applyContentScriptsSupport,
  getContentScriptEntryNames,
  normalizeContentScriptsOptions,
} from '@webx-kit/core-plugin/content-script';
import { applyCorsSupport } from '@webx-kit/core-plugin/cors';
import { applyEnvSupport, isDev } from '@webx-kit/core-plugin/env';
import { type ManifestOptions, applyManifestSupport } from '@webx-kit/core-plugin/manifest';
import { titleCase } from '@webx-kit/core-plugin/utils';
import { BackgroundReloadPlugin } from './plugins/background/live-reload-plugin';
import { ContentScriptHMRPlugin } from './plugins/content-script/hmr-plugin';
import { ContentScriptPublicPathPlugin } from './plugins/content-script/public-path-plugin';
import { ContentScriptShadowRootPlugin } from './plugins/content-script/shadow-root-plugin';

export interface WebxPluginOptions extends BackgroundOptions, ContentScriptsOptions, ManifestOptions {}

function getDefaultConfig({
  allInOneEntries,
  defaultConfig,
  userConfig,
}: {
  allInOneEntries: Set<string>;
  defaultConfig: Readonly<RsbuildConfig>;
  userConfig: Readonly<RsbuildConfig>;
}): RsbuildConfig {
  const port = process.env.PORT ? Number(process.env.PORT) : userConfig.server?.port || defaultConfig.server?.port;
  return {
    source: {
      define: {
        __DEV__: userConfig.source?.define?.__DEV__ ?? isDev(),
      },
    },
    dev: {
      assetPrefix: userConfig.dev?.assetPrefix ?? true,
      client: userConfig.dev?.client ?? {
        protocol: 'ws',
        host: 'localhost',
        port,
      },
      writeToDisk: userConfig.dev?.writeToDisk ?? ((filename) => !filename.includes('.hot-update.')),
    },
    output: {
      distPath: {
        ...(process.env.WEBX_DIST ? { root: process.env.WEBX_DIST } : null),
      },
      filenameHash: false,
    },
    html: {
      title: userConfig.html?.title ?? (({ entryName }) => titleCase(entryName)),
    },
    server: {
      publicDir: false,
      port,
      printUrls: false,
    },
    tools: {
      bundlerChain(chain) {
        // DO NOT split chunks when the entry is background/content-scripts
        chain.optimization.runtimeChunk(false).splitChunks({
          chunks: (chunk) => [...chunk.runtime].every((runtime) => !allInOneEntries.has(runtime)),
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
        return mergeRsbuildConfig(
          config,
          getDefaultConfig({
            allInOneEntries,
            defaultConfig: api.getRsbuildConfig('current'),
            userConfig: api.getRsbuildConfig('original'),
          })
        );
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
      applyCorsSupport(api);
      applyEnvSupport(api);
      applyManifestSupport(api, normalizedOptions);
    },
  };
};
