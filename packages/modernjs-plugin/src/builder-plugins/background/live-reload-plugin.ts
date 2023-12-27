import type { webpack as webpackNS } from '@modern-js/app-tools';

export class BackgroundReloadPlugin {
  constructor(readonly backgroundEntryName: string, readonly autoReload: boolean) {}

  apply(compiler: webpackNS.Compiler) {
    const {
      webpack,
      webpack: { RuntimeGlobals },
    } = compiler;

    const autoReload = this.autoReload;

    compiler.hooks.thisCompilation.tap('BackgroundReloadPlugin', (compilation) => {
      const isEnabledForChunk = (chunk: webpackNS.Chunk) => chunk.getEntryOptions()?.name === this.backgroundEntryName;

      const {
        runtimeTemplate,
        outputOptions: { hotUpdateGlobal },
      } = compilation;

      class BackgroundReloadRuntimeModule extends webpack.RuntimeModule {
        generate() {
          if (!this.chunk) return null;
          return webpack.Template.asString([
            // shim window.location.reload() behavior
            autoReload
              ? `self.window = { location: { reload: () => chrome.runtime.reload() } }`
              : `self.window = { location: { reload: () => { /* noop */ } } }`,

            // jsonp is not working in the ServiceWorker environment, and dynamic scripts are NOT supported
            `${RuntimeGlobals.loadScript} = async function (url, done, key, chunkId) {
              const code = await fetch(url).then((res) => res.text());
              const [, hash] = /__webpack_require__\\.h = function\\(\\) { return "(\\w+)"; }/.exec(code) || [];`,

            autoReload
              ? `const hasUpdate = /^\\/\\*\\*\\*\\/ ".+":$/m.test(code);
                 if (hasUpdate) chrome.runtime.reload();`
              : ``,

            // update the full hash, tell HMR client that we are done
            `${runtimeTemplate.globalObject}[${JSON.stringify(hotUpdateGlobal)}](${JSON.stringify(this.chunk.id)},
                {}, (__webpack_require__) => { __webpack_require__.h = () => hash; }
              );
              done(null);
            };`,
          ]);
        }
      }

      const onceForChunkSet = new WeakSet<webpackNS.Chunk>();
      const handler = (chunk: webpackNS.Chunk, set: Set<string>) => {
        if (onceForChunkSet.has(chunk)) return;
        onceForChunkSet.add(chunk);
        if (!isEnabledForChunk(chunk)) return;
        set.add(RuntimeGlobals.moduleFactoriesAddOnly);
        set.add(RuntimeGlobals.hasOwnProperty);
        compilation.addRuntimeModule(
          chunk,
          new BackgroundReloadRuntimeModule('background reload runtime', webpack.RuntimeModule.STAGE_ATTACH)
        );
      };
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.ensureChunkHandlers)
        .tap('BackgroundReloadPlugin', handler);
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
        .tap('BackgroundReloadPlugin', handler);
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.hmrDownloadManifest)
        .tap('BackgroundReloadPlugin', handler);
      compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.baseURI).tap('BackgroundReloadPlugin', handler);

      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.ensureChunkHandlers)
        .tap('BackgroundReloadPlugin', (chunk, set) => {
          if (!isEnabledForChunk(chunk)) return;
          set.add(RuntimeGlobals.publicPath);
          set.add(RuntimeGlobals.getChunkScriptFilename);
        });
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
        .tap('BackgroundReloadPlugin', (chunk, set) => {
          if (!isEnabledForChunk(chunk)) return;
          set.add(RuntimeGlobals.publicPath);
          set.add(RuntimeGlobals.getChunkUpdateScriptFilename);
          set.add(RuntimeGlobals.moduleCache);
          set.add(RuntimeGlobals.hmrModuleData);
          set.add(RuntimeGlobals.moduleFactoriesAddOnly);
        });
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.hmrDownloadManifest)
        .tap('BackgroundReloadPlugin', (chunk, set) => {
          if (!isEnabledForChunk(chunk)) return;
          set.add(RuntimeGlobals.publicPath);
          set.add(RuntimeGlobals.getUpdateManifestFilename);
        });
    });
  }
}
