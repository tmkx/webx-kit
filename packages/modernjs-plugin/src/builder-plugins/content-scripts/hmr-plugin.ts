import type { webpack as webpackNS } from '@modern-js/app-tools';

export class ContentScriptHMRPlugin {
  constructor(readonly contentScriptEntries: Set<string>) {}

  apply(compiler: webpackNS.Compiler) {
    const { contentScriptEntries } = this;

    const {
      webpack,
      webpack: { RuntimeGlobals },
    } = compiler;

    class ContentScriptHMRRuntimeModule extends webpack.RuntimeModule {
      constructor() {
        super('content-script hmr runtime', webpack.RuntimeModule.STAGE_ATTACH);
      }

      generate() {
        if (!this.chunk) return null;
        return webpack.Template.asString([
          // jsonp will cause cross-context issues in the isolated content-script environment
          `${RuntimeGlobals.loadScript} = async function (url, done, key, chunkId) {
            await import(url);
            done(null);
          };`,
        ]);
      }
    }

    compiler.hooks.thisCompilation.tap('ContentScriptHMRPlugin', (compilation) => {
      const isEnabledForChunk = (chunk: webpackNS.Chunk) => {
        const entryName = chunk.getEntryOptions()?.name;
        if (!entryName) return false;
        return contentScriptEntries.has(entryName);
      };

      const onceForChunkSet = new WeakSet<webpackNS.Chunk>();
      const handler = (chunk: webpackNS.Chunk, set: Set<string>) => {
        if (onceForChunkSet.has(chunk)) return;
        onceForChunkSet.add(chunk);
        if (!isEnabledForChunk(chunk)) return;
        set.add(RuntimeGlobals.moduleFactoriesAddOnly);
        set.add(RuntimeGlobals.hasOwnProperty);
        compilation.addRuntimeModule(chunk, new ContentScriptHMRRuntimeModule());
      };
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.ensureChunkHandlers)
        .tap('ContentScriptHMRPlugin', handler);
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
        .tap('ContentScriptHMRPlugin', handler);
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.hmrDownloadManifest)
        .tap('ContentScriptHMRPlugin', handler);
      compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.baseURI).tap('ContentScriptHMRPlugin', handler);

      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.ensureChunkHandlers)
        .tap('ContentScriptHMRPlugin', (chunk, set) => {
          if (!isEnabledForChunk(chunk)) return;
          set.add(RuntimeGlobals.publicPath);
          set.add(RuntimeGlobals.getChunkScriptFilename);
        });
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
        .tap('ContentScriptHMRPlugin', (chunk, set) => {
          if (!isEnabledForChunk(chunk)) return;
          set.add(RuntimeGlobals.publicPath);
          set.add(RuntimeGlobals.getChunkUpdateScriptFilename);
          set.add(RuntimeGlobals.moduleCache);
          set.add(RuntimeGlobals.hmrModuleData);
          set.add(RuntimeGlobals.moduleFactoriesAddOnly);
        });
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.hmrDownloadManifest)
        .tap('ContentScriptHMRPlugin', (chunk, set) => {
          if (!isEnabledForChunk(chunk)) return;
          set.add(RuntimeGlobals.publicPath);
          set.add(RuntimeGlobals.getUpdateManifestFilename);
        });
    });
  }
}
