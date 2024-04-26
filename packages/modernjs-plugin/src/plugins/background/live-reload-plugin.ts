import type { webpack as webpackNS } from '@modern-js/app-tools';
import { generateLoadScriptCode } from '@webx-kit/core-plugin/background';

export const PLUGIN_NAME = 'webx:background-reload';

export class BackgroundReloadPlugin {
  name = PLUGIN_NAME;

  constructor(readonly backgroundEntryName: string, readonly autoReload: boolean) {}

  apply(compiler: webpackNS.Compiler) {
    const autoReload = this.autoReload;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      const isEnabledForChunk = (chunk: webpackNS.Chunk) => chunk.getEntryOptions()?.name === this.backgroundEntryName;

      compilation.hooks.runtimeModule.tap(PLUGIN_NAME, (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'load script') patchLoadScriptRuntimeModule(module, compiler, compilation, autoReload);
      });
    });
  }
}

function patchLoadScriptRuntimeModule(
  module: webpackNS.RuntimeModule,
  { webpack, webpack: { RuntimeGlobals } }: webpackNS.Compiler,
  { outputOptions }: webpackNS.Compilation,
  autoReload: boolean
) {
  module.name = 'background load script';
  module.generate = function (this: webpackNS.RuntimeModule) {
    if (!this.chunk) return null;
    return webpack.Template.asString(
      generateLoadScriptCode({ RuntimeGlobals, outputOptions, chunkId: this.chunk.id, autoReload })
    );
  };
}
