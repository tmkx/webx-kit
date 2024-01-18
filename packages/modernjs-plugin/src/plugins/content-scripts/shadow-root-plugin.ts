import path from 'node:path';
import type { webpack as webpackNS } from '@modern-js/app-tools';
import { ContentScriptBasePlugin } from './base-plugin';
import { ROOT_NAME, STYLE_ROOT_NAME } from './constants.mjs';

export class ContentScriptShadowRootPlugin extends ContentScriptBasePlugin {
  apply(compiler: webpackNS.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap('ContentScriptShadowRootPlugin', (compilation) => {
      compilation.hooks.runtimeModule.tap('ContentScriptShadowRootPlugin', (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'css loading') patchCSSLoadingRuntimeModule(module);
      });
    });

    new compiler.webpack.NormalModuleReplacementPlugin(
      /mini-css-extract-plugin\/dist\/hmr\/hotModuleReplacement\.js$/,
      (resolveData) => {
        const shadowRootLoader = path.resolve(__dirname, 'shadow-root-loader.js');
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
