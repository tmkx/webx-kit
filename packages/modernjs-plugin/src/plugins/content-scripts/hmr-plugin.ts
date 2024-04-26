import type { webpack as webpackNS } from '@modern-js/app-tools';
import { generateLoadScriptCode } from '@webx-kit/core-plugin/content-script';
import { ContentScriptBasePlugin } from './base-plugin';

export const PLUGIN_NAME = 'webx:content-script-hmr';

export class ContentScriptHMRPlugin extends ContentScriptBasePlugin {
  name = PLUGIN_NAME;

  apply(compiler: webpackNS.Compiler) {
    const { isEnabledForChunk } = this;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.runtimeModule.tap(PLUGIN_NAME, (module, chunk) => {
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
    return webpack.Template.asString(generateLoadScriptCode({ RuntimeGlobals }));
  };
}
