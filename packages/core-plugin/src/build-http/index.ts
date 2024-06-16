import fs from 'node:fs';
import path from 'node:path';
import { RsbuildPluginAPI, Rspack } from '@rsbuild/shared';

const buildHttpLoader = (function () {
  const devLoader = path.resolve(__dirname, 'build-http-loader-dev.js');
  if (process.env.NODE_ENV === 'development') return devLoader;
  const prodLoader = path.resolve(__dirname, 'build-http-loader.js');
  if (fs.existsSync(prodLoader)) return prodLoader;
  return devLoader;
})();

export function applyBuildHttpSupport(api: RsbuildPluginAPI) {
  api.modifyBundlerChain((chain) => {
    chain.externalsPresets({ web: false }).plugin(BUILD_HTTP_PLUGIN_NAME).use(BuildHttpPlugin);
  });
}

const BUILD_HTTP_PLUGIN_NAME = 'webx:build-http';
const HTTP_RE = /^https?:/;

class BuildHttpPlugin {
  name = BUILD_HTTP_PLUGIN_NAME;

  apply(compiler: Rspack.Compiler) {
    compiler.hooks.compilation.tap(BUILD_HTTP_PLUGIN_NAME, (_compilation, { normalModuleFactory }) => {
      normalModuleFactory.hooks.beforeResolve.tapAsync(BUILD_HTTP_PLUGIN_NAME, (resolveData, callback) => {
        if (HTTP_RE.test(resolveData.request)) {
          resolveData.request = `${buildHttpLoader}!${__filename}?request=${encodeURIComponent(resolveData.request)}`;
        }
        callback(null);
      });
    });
  }
}
