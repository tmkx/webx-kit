import type { Rspack } from '@rsbuild/core';
import { ContentScriptBasePlugin } from './base-plugin';
import type { JsRuntimeModule } from '../../utils/types';

export const PLUGIN_NAME = 'webx:content-script-hmr';

export class ContentScriptHMRPlugin extends ContentScriptBasePlugin {
  name = PLUGIN_NAME;

  apply(compiler: Rspack.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.runtimeModule.tap(PLUGIN_NAME, (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'load_script') patchLoadScriptRuntimeModule(module, compiler);
      });
    });
  }
}

function generateLoadScriptCode(options: { RuntimeGlobals: Rspack.Compiler['webpack']['RuntimeGlobals'] }): string[] {
  return [
    // jsonp will cause cross-context issues in the isolated content-script environment
    `${options.RuntimeGlobals.loadScript} = async function (url, done) {
      await import(url);
      done(null);
    };`,
  ];
}

function patchLoadScriptRuntimeModule(module: JsRuntimeModule, { webpack: { RuntimeGlobals } }: Rspack.Compiler) {
  if (!module.source) return;
  module.name = 'content-script load script';
  module.source.source = Buffer.from(generateLoadScriptCode({ RuntimeGlobals }).join(';\n'), 'utf-8');
}
