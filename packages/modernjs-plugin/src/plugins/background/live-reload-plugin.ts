import type { webpack as webpackNS } from '@modern-js/app-tools';

export class BackgroundReloadPlugin {
  constructor(readonly backgroundEntryName: string, readonly autoReload: boolean) {}

  apply(compiler: webpackNS.Compiler) {
    const autoReload = this.autoReload;

    compiler.hooks.thisCompilation.tap('BackgroundReloadPlugin', (compilation) => {
      const isEnabledForChunk = (chunk: webpackNS.Chunk) => chunk.getEntryOptions()?.name === this.backgroundEntryName;

      compilation.hooks.runtimeModule.tap('BackgroundReloadPlugin', (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'load script') patchLoadScriptRuntimeModule(module, compiler, compilation, autoReload);
      });
    });
  }
}

function patchLoadScriptRuntimeModule(
  module: webpackNS.RuntimeModule,
  { webpack, webpack: { RuntimeGlobals } }: webpackNS.Compiler,
  { runtimeTemplate, outputOptions: { hotUpdateGlobal } }: webpackNS.Compilation,
  autoReload: boolean
) {
  module.name = 'background load script';
  module.generate = function (this: webpackNS.RuntimeModule) {
    if (!this.chunk) return null;
    return webpack.Template.asString([
      // shim window.location.reload() behavior
      autoReload
        ? `self.window = { location: { reload: () => chrome.runtime.reload() } }`
        : `self.window = { location: { reload: () => { /* noop */ } } }`,

      // jsonp is not working in the ServiceWorker environment, and dynamic scripts are NOT supported
      `${RuntimeGlobals.loadScript} = async function (url, done, key, chunkId) {
      const code = await fetch(url).then((res) => res.text());`,
      // __webpack_require__.h = function() { return "xxxxxxxx"; }
      // __webpack_require__.h = () => ("xxxxxxxx")
      `const [, hash] = /__webpack_require__\\.h =.+?"(\\w+)"/.exec(code) || [];`,

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
  };
}
