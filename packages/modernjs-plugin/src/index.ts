import path from 'node:path';
import { AppTools, CliPlugin, UserConfig, mergeConfig } from '@modern-js/app-tools';
import { WebpackChain, pkgUp, lodash } from '@modern-js/utils';
import { RsbuildPlugin, isDev } from '@rsbuild/shared';
import { BackgroundOptions, applyBackgroundSupport, getBackgroundEntryNames } from '@webx-kit/core-plugin/background';
import {
  ContentScriptsOptions,
  NormalizeContentScriptsOptions,
  applyContentScriptsSupport,
  getContentScriptEntryNames,
  normalizeContentScriptsOptions,
} from '@webx-kit/core-plugin/content-script';
import { ManifestOptions, applyManifestSupport } from '@webx-kit/core-plugin/manifest';
import { titleCase } from '@webx-kit/core-plugin/utils';
import { BackgroundReloadPlugin } from './plugins/background/live-reload-plugin';
import { CleanOptions, applyCleanSupport } from './plugins/clean';
import { applyHMRCorsSupport } from './plugins/hmr-cors';
import { ContentScriptHMRPlugin } from './plugins/content-scripts/hmr-plugin';
import { ContentScriptPublicPathPlugin } from './plugins/content-scripts/public-path-plugin';
import { ContentScriptShadowRootPlugin } from './plugins/content-scripts/shadow-root-plugin';

export { isDev, isProd } from '@rsbuild/shared';

export type { BackgroundEntry } from '@webx-kit/core-plugin/background';
export type { ContentScriptEntry } from '@webx-kit/core-plugin/content-script';

export interface WebxPluginOptions extends BackgroundOptions, ContentScriptsOptions, CleanOptions, ManifestOptions {}

const getDefaultConfig = ({ allInOneEntries }: { allInOneEntries: Set<string> }): UserConfig<AppTools<'shared'>> => {
  const webxRuntimePackageJsonPath = lodash.attempt(() =>
    pkgUp.sync({
      cwd: require.resolve('@webx-kit/runtime', { paths: [process.cwd()] }),
    })
  );

  return {
    source: {
      entriesDir: './src/pages',
      define: {
        __DEV__: isDev(),
      },
      include: typeof webxRuntimePackageJsonPath === 'string' ? [path.dirname(webxRuntimePackageJsonPath)] : [],
    },
    dev: {
      assetPrefix: true,
    },
    html: {
      disableHtmlFolder: true,
      title: ({ entryName }) => titleCase(entryName),
    },
    bff: {
      proxy: {
        '/': {
          target: 'https://www.example.com/',
          // @ts-expect-error suppress 404 for hot-update files
          onProxyReq(_proxyReq, req, res) {
            if (req.url.includes('.hot-update.')) res.end('');
          },
        },
      },
    },
    output: {
      disableInlineRuntimeChunk: true, // inline scripts are not allowed in MV3
      /** @deprecated */
      disableFilenameHash: true,
      filenameHash: false,
      disableSourceMap: !isDev(),
      distPath: {
        ...(process.env.WEBX_DIST ? { root: process.env.WEBX_DIST } : null),
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

      const normalizedOptions = normalizeContentScriptsOptions(options);
      const allInOneEntries = new Set([
        ...getBackgroundEntryNames(normalizedOptions),
        ...getContentScriptEntryNames(normalizedOptions),
      ]);
      const defaultConfig = getDefaultConfig({ allInOneEntries });
      Object.assign(config, mergeConfig([defaultConfig, config]));

      (config.builderPlugins ??= []).push(webxBuilderPlugin(normalizedOptions));
    },
  };
};

function webxBuilderPlugin(options: NormalizeContentScriptsOptions<WebxPluginOptions>): RsbuildPlugin {
  return {
    name: '@webx-kit/modernjs-plugin/builder',
    setup(api) {
      applyBackgroundSupport(api, options, ({ entryName, backgroundLiveReload }) =>
        isDev() ? [new BackgroundReloadPlugin(entryName, backgroundLiveReload)] : []
      );
      applyContentScriptsSupport(api, options, ({ contentScriptNames }) =>
        isDev()
          ? [new ContentScriptHMRPlugin(contentScriptNames), new ContentScriptShadowRootPlugin(contentScriptNames)]
          : [new ContentScriptPublicPathPlugin(contentScriptNames)]
      );
      applyManifestSupport(api, options);
      applyCleanSupport(api, options);
      applyHMRCorsSupport(api);
    },
  };
}
