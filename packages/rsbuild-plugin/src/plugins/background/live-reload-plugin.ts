import type { Rspack } from '@rsbuild/shared';
import type { JsChunk, JsRuntimeModule } from '../../utils/types';

export class BackgroundReloadPlugin {
  constructor(readonly backgroundEntryName: string, readonly autoReload: boolean) {}

  apply(compiler: Rspack.Compiler) {
    const autoReload = this.autoReload;

    compiler.hooks.thisCompilation.tap('BackgroundReloadPlugin', (compilation) => {
      compilation;
      const isEnabledForChunk = (chunk: JsChunk) => chunk.chunkReasons.includes('Entrypoint(background)');

      compilation.hooks.runtimeModule.tap('BackgroundReloadPlugin', (module, chunk) => {
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
  chunk: JsChunk,
  { webpack: { RuntimeGlobals } }: Rspack.Compiler,
  { outputOptions: { hotUpdateGlobal } }: Rspack.Compilation,
  autoReload: boolean
) {
  if (!module.source) return;
  module.name = 'background load script';

  // shim window.location.reload() behavior
  const windowReloadShim = autoReload
    ? `self.window = { location: { reload: () => { chrome.runtime.reload(); } } };`
    : `self.window = { location: { reload: () => { /* noop */ } } };`;

  // jsonp is not working in the ServiceWorker environment, and dynamic scripts are NOT supported
  const loadScript = [
    // jsonp is not working in the ServiceWorker environment, and dynamic scripts are NOT supported
    `${RuntimeGlobals.loadScript} = async function (url, done, key, chunkId) {
    const code = await fetch(url).then((res) => res.text());`,
    // __webpack_require__.h = function() { return "xxxxxxxx"; }
    // __webpack_require__.h = function() {
    //  return "xxxxxxxx";
    // }
    // __webpack_require__.h = () => ("xxxxxxxx")
    `const [, hash] = /__webpack_require__\\.h =[\\s\\S]+?"(\\w+)"/.exec(code) || [];`,

    autoReload
      ? // /**** "moduleId":
        // "moduleId":
        `const hasUpdate = /^[\/*\\s]*".+":/m.test(code);
       if (hasUpdate) { chrome.runtime.reload(); }`
      : ``,

    // update the full hash, tell HMR client that we are done
    `self[${JSON.stringify(hotUpdateGlobal)}](${JSON.stringify(chunk.id)},
        {}, (__webpack_require__) => { __webpack_require__.h = () => hash; }
      );
      done(null);
    };`,
  ].join(';\n');

  module.source.source = Buffer.from([windowReloadShim, loadScript].join(';'), 'utf-8');
}

function clearRuntimeModule(module: JsRuntimeModule) {
  if (!module.source) return;
  module.source.source = Buffer.from('', 'utf-8');
}
