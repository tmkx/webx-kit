import path from 'node:path';
import type { webpack as webpackNS } from '@modern-js/app-tools';
import { ContentScriptBasePlugin } from './base-plugin';
import { ROOT_NAME, STYLE_ROOT_NAME } from './constants.mjs';
import { tapRuntimeModule } from '../../utils';

export class ContentScriptShadowRootPlugin extends ContentScriptBasePlugin {
  apply(compiler: webpackNS.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap('ContentScriptShadowRootPlugin', (compilation) => {
      tapRuntimeModule(this.isRspack, compilation, 'ContentScriptShadowRootPlugin', (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'css loading') patchCSSLoadingRuntimeModule(module);
      });
    });

    compiler.hooks.normalModuleFactory.tap('ContentScriptShadowRootPlugin', (nmf) => {
      nmf.hooks.beforeResolve.tap('ContentScriptShadowRootPlugin', (result) => {
        if (result.request.endsWith('mini-css-extract-plugin/dist/hmr/hotModuleReplacement.js')) {
          const shadowRootLoader = path.resolve(__dirname, 'shadow-root-loader.js');
          result.request = `${shadowRootLoader}!${result.request}`;
        }
      });
    });
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
