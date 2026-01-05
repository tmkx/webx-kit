import path from 'node:path';
import { type RsbuildPluginAPI, rspack } from '@rsbuild/core';
import { isDev } from '../env';
import { registerManifestTransformer } from '../manifest';

const ENV_NAME = 'background';

export type BackgroundEntry = {
  name: string;
  import: string;
};

export type BackgroundOptions = {
  /**
   * background service-worker entry
   */
  background?: string;
  /**
   * auto reload when the background changed
   *
   * @default true
   */
  backgroundLiveReload?: boolean;
};

export function applyBackgroundSupport(api: RsbuildPluginAPI, options: BackgroundOptions): boolean {
  const { background } = options;
  if (!background) return false;

  registerManifestTransformer('background', manifest => {
    manifest.background = {
      service_worker: 'background.js',
      type: 'module',
    };
    // if (enableAutoRefreshContentScripts) {
    //   manifest.permissions ??= [];
    //   if (!manifest.permissions.includes('scripting')) manifest.permissions.push('scripting');
    // }
  });

  api.onAfterCreateCompiler(({ compiler, environments }) => {
    if (!('compilers' in compiler)) return;
    const bgCompiler = compiler.compilers.find(compiler => compiler.name === ENV_NAME);
    const bgEnvironment = environments[ENV_NAME];
    if (!bgCompiler || !bgEnvironment) return;
    new rspack.webpack.DefinePlugin({
      RSBUILD_WEB_SOCKET_TOKEN: JSON.stringify(bgEnvironment.webSocketToken),
      RSBUILD_CLIENT_CONFIG: JSON.stringify(bgEnvironment.config.dev.client),
    }).apply(bgCompiler);
  });

  api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
    return mergeRsbuildConfig(config, {
      environments: {
        background: {
          source: {
            entry: {
              background: {
                import: background,
              },
            },
            preEntry: isDev()
              ? process.env.NODE_ENV === 'development'
                ? [path.resolve(__dirname, 'live-reload.ts')]
                : [path.resolve(__dirname, 'live-reload.cjs')]
              : [],
          },
          output: {
            target: 'web-worker',
            filenameHash: false,
            distPath: { js: '.' },
            externals: () => false,
            sourceMap: isDev()
              ? {
                  js: 'inline-cheap-source-map',
                }
              : false,
          },
        },
      },
    });
  });

  return true;
}
