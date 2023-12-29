import type { webpack as webpackNS } from '@modern-js/app-tools';
import { ContentScriptBasePlugin } from './base-plugin';

export class ContentScriptPublicPathPlugin extends ContentScriptBasePlugin {
  apply(compiler: webpackNS.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap('ContentScriptPublicPathPlugin', (compilation) => {
      compilation.hooks.runtimeModule.tap('ContentScriptPublicPathPlugin', (module, chunk) => {
        if (!isEnabledForChunk(chunk)) return;
        if (module.name === 'publicPath') patchPublicPathRuntimeModule(module, compiler);
      });
    });
  }
}

function patchPublicPathRuntimeModule(
  module: webpackNS.RuntimeModule,
  { webpack, webpack: { RuntimeGlobals } }: webpackNS.Compiler
) {
  module.name = 'content-script publicPath';
  module.generate = function (this: webpackNS.RuntimeModule) {
    return webpack.Template.asString([`${RuntimeGlobals.publicPath} = chrome.runtime.getURL('/');`]);
  };
}
