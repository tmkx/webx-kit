import type { RsbuildEntry, RsbuildPlugin } from '@rsbuild/core';
import { type BackgroundOptions, applyBackgroundSupport } from './plugins/background';
import { applyBuildHttpSupport } from './plugins/build-http';
import {
  type ContentScriptsOptions,
  applyContentScriptsSupport,
  normalizeContentScriptsOptions,
} from './plugins/content-script';
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
      let mainEnv: string | undefined;

      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
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
            cors: true,
          },
        });
      });

      if (applyBackgroundSupport(api, normalizedOptions)) mainEnv = 'background';
      if (applyContentScriptsSupport(api, normalizedOptions)) mainEnv = 'content-script';
      applyBuildHttpSupport(api);
      applyEnvSupport(api);
      applyManifestSupport(api, normalizedOptions);

      if (Object.keys(options.pages || {}).length > 0) {
        mainEnv = 'web';
        api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
          return mergeRsbuildConfig(config, {
            environments: {
              web: {
                source: {
                  entry: Object.keys(options.pages || {}).length > 0 ? options.pages : {},
                },
              },
            },
          });
        });
      }

      if (mainEnv) {
        api.modifyEnvironmentConfig((config, { name }) => {
          // Prevent unnecessary operations
          if (name === mainEnv) return;
          config.output.copy = [];
        });
      }
    },
  };
};
