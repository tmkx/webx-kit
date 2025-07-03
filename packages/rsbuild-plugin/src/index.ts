import type { RsbuildEntry, RsbuildPlugin } from '@rsbuild/core';
import { type BackgroundOptions, applyBackgroundSupport } from './plugins/background';
import { applyBuildHttpSupport } from './plugins/build-http';
import {
  type ContentScriptsOptions,
  applyContentScriptsSupport,
  getContentScriptEntryNames,
  normalizeContentScriptsOptions,
} from './plugins/content-script';
import { ContentScriptHMRPlugin } from './plugins/content-script/hmr-plugin';
import { ContentScriptPublicPathPlugin } from './plugins/content-script/public-path-plugin';
import { ContentScriptShadowRootPlugin } from './plugins/content-script/shadow-root-plugin';
import { applyCorsSupport } from './plugins/cors';
import { applyEnvSupport, isDev } from './plugins/env';
import { type ManifestOptions, applyManifestSupport } from './plugins/manifest';
import { titleCase } from './utils/misc';

export interface WebxPluginOptions extends BackgroundOptions, ContentScriptsOptions, ManifestOptions {
  pages?: RsbuildEntry;
}

export const webxPlugin = (options: WebxPluginOptions = {}): RsbuildPlugin => {
  return {
    name: 'webx:rsbuild-plugin',
    setup(api) {
      const normalizedOptions = normalizeContentScriptsOptions(options);
      const allInOneEntries = new Set(getContentScriptEntryNames(normalizedOptions));
      const defaultConfig = api.getRsbuildConfig('current');
      const userConfig = api.getRsbuildConfig('original');
      const port = process.env.PORT ? Number(process.env.PORT) : userConfig.server?.port || defaultConfig.server?.port;
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
          ...(Object.keys(options.pages || {}).length > 0
            ? {
                environments: {
                  web: {
                    source: {
                      entry: Object.keys(options.pages || {}).length > 0 ? options.pages : {},
                    },
                    output: {
                      target: 'web',
                    },
                  },
                },
              }
            : null),
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
              port,
            },
            writeToDisk: (file) => !file.includes('.hot-update.'),
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
        });
      });
      applyBackgroundSupport(api, normalizedOptions);
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
