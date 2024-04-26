import { Rspack } from '@rsbuild/shared';
import { ROOT_NAME, STYLE_ROOT_NAME } from '@webx-kit/core-plugin/constants';
import { ContentScriptBasePlugin } from './base-plugin';
import type { JsRuntimeModule } from '../../utils/types';

export const PLUGIN_NAME = 'webx:content-script-shadow-root';

export class ContentScriptShadowRootPlugin extends ContentScriptBasePlugin {
  name = PLUGIN_NAME;

  apply(compiler: Rspack.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.runtimeModule.tap(PLUGIN_NAME, (module, chunk) => {
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
