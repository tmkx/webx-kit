import { loadEnv } from '@rsbuild/core';
import { type RsbuildPluginAPI, getNodeEnv } from '@rsbuild/shared';

export const ENV_PREFIX = 'WEBX_PUBLIC_';

const envMode = process.argv.find((_value, index, args) => index > 0 && args[index - 1] === '--env-mode');

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
