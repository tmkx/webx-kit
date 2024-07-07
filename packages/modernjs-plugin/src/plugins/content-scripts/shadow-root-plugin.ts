import type { Rspack, webpack as webpackNS } from '@modern-js/app-tools';
import { PLUGIN_NAME, CSSExtractPatchPlugin, patchCSSLoadingCode } from '@webx-kit/core-plugin/shadow-root';
import { ContentScriptBasePlugin } from './base-plugin';

export { PLUGIN_NAME };

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

    new CSSExtractPatchPlugin(/mini-css-extract-plugin\/dist\/hmr\/hotModuleReplacement\.js$/).apply(
      compiler as unknown as Rspack.Compiler
    );
  }
}

function patchCSSLoadingRuntimeModule(module: webpackNS.RuntimeModule) {
  const originalGenerate = module.generate;
  module.generate = function (this: webpackNS.RuntimeModule) {
    const originalCode = originalGenerate.call(this);
    if (originalCode === null) return originalCode;
    return patchCSSLoadingCode(originalCode);
  };
}
