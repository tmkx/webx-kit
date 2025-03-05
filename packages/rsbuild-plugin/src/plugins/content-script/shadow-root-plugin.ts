import type { Rspack } from '@rsbuild/core';
import { PLUGIN_NAME, CSSExtractPatchPlugin, patchCSSLoadingCode } from '@webx-kit/core-plugin/shadow-root';
import { ContentScriptBasePlugin } from './base-plugin';
import type { JsRuntimeModule } from '../../utils/types';

export { PLUGIN_NAME };

export class ContentScriptShadowRootPlugin extends ContentScriptBasePlugin {
  name = PLUGIN_NAME;

  apply(compiler: Rspack.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.runtimeModule.tap(PLUGIN_NAME, (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'css loading') patchCSSLoadingRuntimeModule(module);
      });
    });

    new CSSExtractPatchPlugin(/\/@rspack\/core\/dist\/cssExtractHmr\.js$/).apply(compiler);
  }
}

function patchCSSLoadingRuntimeModule(module: JsRuntimeModule) {
  if (!module.source) return;
  module.name = 'content-scripts css loading';
  const originCode = module.source.source.toString('utf-8');
  module.source.source = Buffer.from(patchCSSLoadingCode(originCode), 'utf-8');
}
