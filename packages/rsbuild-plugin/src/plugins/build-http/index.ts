/**
 * shim for https://webpack.js.org/configuration/experiments/#experimentsbuildhttp
 */
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
  if (api.context.bundlerType !== 'rspack') return;
  api.modifyBundlerChain((chain, {}) => {
    chain.plugin(BUILT_HTTP_PLUGIN_NAME).use(BuildHttpPlugin);
  });
}

const BUILT_HTTP_PLUGIN_NAME = 'webx:build-http';

class BuildHttpPlugin {
  name = BUILT_HTTP_PLUGIN_NAME;

  apply(compiler: Rspack.Compiler) {
    new compiler.webpack.NormalModuleReplacementPlugin(/^https?:\/\//, async (resolveData) => {
      resolveData.request = `${buildHttpLoader}!${__filename}?request=${encodeURIComponent(resolveData.request)}`;
      // await new Promise((resolve) => void setTimeout(resolve, 1000));
      // resolveData.request = createVirtualModule(`console.log('${resolveData.request}')`);
    }).apply(compiler);
  }
}
