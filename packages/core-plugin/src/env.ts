import { loadEnv } from '@rsbuild/core';
import { RsbuildPluginAPI } from '@rsbuild/shared';

export const ENV_PREFIX = 'WEBX_PUBLIC_';

export const { publicVars } = loadEnv({
  prefixes: [ENV_PREFIX],
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
