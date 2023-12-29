import type { webpack as webpackNS } from '@modern-js/app-tools';

export class ContentScriptHMRPlugin {
  constructor(readonly contentScriptEntries: Set<string>) {}

  apply(compiler: webpackNS.Compiler) {
    const { contentScriptEntries } = this;

    compiler.hooks.thisCompilation.tap('ContentScriptHMRPlugin', (compilation) => {
      const isEnabledForChunk = (chunk: webpackNS.Chunk) => {
        const entryName = chunk.getEntryOptions()?.name;
        if (!entryName) return false;
        return contentScriptEntries.has(entryName);
      };

      compilation.hooks.runtimeModule.tap('ContentScriptHMRPlugin', (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'load script') patchLoadScriptRuntimeModule(module, compiler);
      });
    });
  }
}

function patchLoadScriptRuntimeModule(
  module: webpackNS.RuntimeModule,
  { webpack, webpack: { RuntimeGlobals } }: webpackNS.Compiler
) {
  module.name = 'content-script load script';
  module.generate = function (this: webpackNS.RuntimeModule) {
    return webpack.Template.asString([
      // jsonp will cause cross-context issues in the isolated content-script environment
      `${RuntimeGlobals.loadScript} = async function (url, done, key, chunkId) {
        await import(url);
        done(null);
      };`,
    ]);
  };
}
