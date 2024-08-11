import type { Rspack } from '@rsbuild/core';
import { generateLoadScriptCode } from '@webx-kit/core-plugin/background';
import type { JsRuntimeModule } from '../../utils/types';

export const PLUGIN_NAME = 'webx:background-reload';

export class BackgroundReloadPlugin {
  name = PLUGIN_NAME;

  constructor(readonly backgroundEntryName: string, readonly autoReload: boolean) {}

  apply(compiler: Rspack.Compiler) {
    const autoReload = this.autoReload;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      const isEnabledForChunk = (chunk: Rspack.Chunk) => chunk.chunkReasons.includes('Entrypoint(background)');

      compilation.hooks.runtimeModule.tap(PLUGIN_NAME, (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'load_script')
          patchLoadScriptRuntimeModule(module, chunk, compiler, compilation, autoReload);
        else if (module.name === 'css_loading') clearRuntimeModule(module);
      });
    });
  }
}

function patchLoadScriptRuntimeModule(
  module: JsRuntimeModule,
  chunk: Rspack.Chunk,
  { webpack: { RuntimeGlobals } }: Rspack.Compiler,
  { outputOptions }: Rspack.Compilation,
  autoReload: boolean
) {
  if (!module.source) return;
  module.name = 'background load script';

  module.source.source = Buffer.from(
    generateLoadScriptCode({ RuntimeGlobals, outputOptions, chunkId: chunk.id, autoReload }).join(';'),
    'utf-8'
  );
}

function clearRuntimeModule(module: JsRuntimeModule) {
  if (!module.source) return;
  module.source.source = Buffer.from('', 'utf-8');
}
