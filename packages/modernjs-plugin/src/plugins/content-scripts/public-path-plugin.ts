import type { webpack as webpackNS } from '@modern-js/app-tools';
import { ContentScriptBasePlugin } from './base-plugin';

export const PLUGIN_NAME = 'ContentScriptPublicPathPlugin';

export class ContentScriptPublicPathPlugin extends ContentScriptBasePlugin {
  name = PLUGIN_NAME;

  apply(compiler: webpackNS.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.runtimeModule.tap(PLUGIN_NAME, (module, chunk) => {
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
