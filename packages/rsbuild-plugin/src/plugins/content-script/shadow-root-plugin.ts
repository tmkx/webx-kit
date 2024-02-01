import { Rspack } from '@rsbuild/shared';
import { ContentScriptBasePlugin } from './base-plugin';
import { ROOT_NAME, STYLE_ROOT_NAME } from './constants.mjs';
import type { JsRuntimeModule } from '../../utils/types';

export class ContentScriptShadowRootPlugin extends ContentScriptBasePlugin {
  apply(compiler: Rspack.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap('ContentScriptShadowRootPlugin', (compilation) => {
      compilation.hooks.runtimeModule.tap('ContentScriptShadowRootPlugin', (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'css_loading') patchCSSLoadingRuntimeModule(module);
      });
    });
  }
}

function patchCSSLoadingRuntimeModule(module: JsRuntimeModule) {
  if (!module.source) return;
  module.name = 'content-scripts css loading';
  const originCode = module.source.source.toString('utf-8');

  module.source.source = Buffer.from(
    originCode
      .replace(
        /document\.(querySelectorAll|getElementsByTagName)/g,
        // if ROOT_NAME is a ShadowRoot, there is no getElementsByTagName method
        `(globalThis.${ROOT_NAME}||document).querySelectorAll`
      )
      .replace(/document\.head/g, `(globalThis.${STYLE_ROOT_NAME}||document.head)`),
    'utf-8'
  );
}
