import type { webpack as webpackNS } from '@modern-js/app-tools';
import { ContentScriptBasePlugin } from './base-plugin';

export class ContentScriptHMRPlugin extends ContentScriptBasePlugin {
  apply(compiler: webpackNS.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap('ContentScriptHMRPlugin', (compilation) => {
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
      `${RuntimeGlobals.loadScript} = async function (url, done) {
        await import(url);
        done(null);
      };`,
    ]);
  };
}
