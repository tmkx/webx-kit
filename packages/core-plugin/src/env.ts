import { loadEnv } from '@rsbuild/core';
import { RsbuildPluginAPI } from '@rsbuild/shared';

export const { publicVars } = loadEnv({
  prefixes: ['WEBX_PUBLIC_'],
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
