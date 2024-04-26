import path from 'node:path';
import type { webpack as webpackNS } from '@modern-js/app-tools';
import { ROOT_NAME, STYLE_ROOT_NAME } from '@webx-kit/core-plugin/constants';
import { ContentScriptBasePlugin } from './base-plugin';

export const PLUGIN_NAME = 'webx:content-script-shadow-root';

const shadowRootLoader = path.resolve(
  __dirname,
  process.env.NODE_ENV === 'development' ? 'shadow-root-loader-dev.js' : 'shadow-root-loader.js'
);

export class ContentScriptShadowRootPlugin extends ContentScriptBasePlugin {
  name = PLUGIN_NAME;

  apply(compiler: webpackNS.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.runtimeModule.tap(PLUGIN_NAME, (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'css loading') patchCSSLoadingRuntimeModule(module);
      });
    });

    new compiler.webpack.NormalModuleReplacementPlugin(
      /mini-css-extract-plugin\/dist\/hmr\/hotModuleReplacement\.js$/,
      (resolveData) => {
        resolveData.request = `${shadowRootLoader}!${resolveData.request}`;
      }
    ).apply(compiler);
  }
}

function patchCSSLoadingRuntimeModule(module: webpackNS.RuntimeModule) {
  const originalGenerate = module.generate;
  module.generate = function (this: webpackNS.RuntimeModule) {
    const originalCode = originalGenerate.call(this);
    if (originalCode === null) return originalCode;
    return originalCode
      .replace(/document\.querySelectorAll/g, `(globalThis.${ROOT_NAME}||document).querySelectorAll`)
      .replace(/document\.head/g, `(globalThis.${STYLE_ROOT_NAME}||document.head)`);
  };
}
