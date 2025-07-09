import type { RsbuildEntry, RsbuildPlugin } from '@rsbuild/core';
import { type BackgroundOptions, applyBackgroundSupport } from './plugins/background';
import { applyBuildHttpSupport } from './plugins/build-http';
import {
  type ContentScriptsOptions,
  applyContentScriptsSupport,
  normalizeContentScriptsOptions,
} from './plugins/content-script';
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
      const defaultConfig = api.getRsbuildConfig('current');
      const userConfig = api.getRsbuildConfig('original');
      const port = process.env.PORT ? Number(process.env.PORT) : userConfig.server?.port || defaultConfig.server?.port;
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(
          config,
          Object.keys(options.pages || {}).length > 0
            ? {
                environments: {
                  web: {
                    source: {
                      entry: Object.keys(options.pages || {}).length > 0 ? options.pages : {},
                    },
                  },
                },
              }
            : {},
          {
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
          }
        );
      });
      applyBackgroundSupport(api, normalizedOptions);
      applyBuildHttpSupport(api);
      applyContentScriptsSupport(api, normalizedOptions);
      applyCorsSupport(api);
      applyEnvSupport(api);
      applyManifestSupport(api, normalizedOptions);
    },
  };
};
