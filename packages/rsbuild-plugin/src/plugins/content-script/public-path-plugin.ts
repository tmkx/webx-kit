import type { Rspack } from '@rsbuild/shared';
import { ContentScriptBasePlugin } from './base-plugin';
import type { JsRuntimeModule } from '../../utils/types';

export class ContentScriptPublicPathPlugin extends ContentScriptBasePlugin {
  apply(compiler: Rspack.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap('ContentScriptPublicPathPlugin', (compilation) => {
      compilation.hooks.runtimeModule.tap('ContentScriptPublicPathPlugin', (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'public_path') patchPublicPathRuntimeModule(module, compiler);
      });
    });
  }
}

function patchPublicPathRuntimeModule(module: JsRuntimeModule, { webpack: { RuntimeGlobals } }: Rspack.Compiler) {
  if (!module.source) return;
  module.name = 'content-script publicPath';
  module.source.source = Buffer.from(`${RuntimeGlobals.publicPath} = chrome.runtime.getURL('/');`, 'utf-8');
}
