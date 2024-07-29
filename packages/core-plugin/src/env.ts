import { type NodeEnv, type RsbuildPluginAPI, loadEnv } from '@rsbuild/core';

export const ENV_PREFIX = 'WEBX_PUBLIC_';

const envMode = process.argv.find((_value, index, args) => index > 0 && args[index - 1] === '--env-mode');

const getNodeEnv = () => process.env.NODE_ENV as NodeEnv;

export const isDev = () => getNodeEnv() === 'development';

export const isProd = () => getNodeEnv() === 'production';

export const { publicVars } = loadEnv({
  prefixes: [ENV_PREFIX],
  mode: envMode || process.env.MODERN_ENV || getNodeEnv(),
});

export function applyEnvSupport(api: RsbuildPluginAPI) {
  api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
    return mergeRsbuildConfig(config, {
      source: {
        define: publicVars,
      },
    });
  });
}
