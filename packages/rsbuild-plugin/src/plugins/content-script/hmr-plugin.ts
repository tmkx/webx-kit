import type { Rspack } from '@rsbuild/shared';
import { ContentScriptBasePlugin } from './base-plugin';
import type { JsRuntimeModule } from '../../utils/types';

export class ContentScriptHMRPlugin extends ContentScriptBasePlugin {
  apply(compiler: Rspack.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap('ContentScriptHMRPlugin', (compilation) => {
      compilation.hooks.runtimeModule.tap('ContentScriptHMRPlugin', (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'load_script') patchLoadScriptRuntimeModule(module, compiler);
      });
    });
  }
}

function patchLoadScriptRuntimeModule(module: JsRuntimeModule, { webpack: { RuntimeGlobals } }: Rspack.Compiler) {
  if (!module.source) return;
  module.name = 'content-script load script';
  module.source.source = Buffer.from(
    [
      // jsonp will cause cross-context issues in the isolated content-script environment
      `${RuntimeGlobals.loadScript} = async function (url, done, key, chunkId) {
      await import(url);
      done(null);
    };`,
    ].join(';\n'),
    'utf-8'
  );
}
