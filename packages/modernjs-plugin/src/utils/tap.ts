import { webpack as webpackNS } from '@modern-js/app-tools';

export function tapRuntimeModule(
  isRspack: boolean | undefined,
  compilation: webpackNS.Compilation,
  options: string,
  hook: (module: webpackNS.RuntimeModule, chunk: webpackNS.Chunk) => void
) {
  if (isRspack) {
    type AddRuntimeModuleFn = webpackNS.Compilation['addRuntimeModule'] & {
      rspack?: ((this: webpackNS.Compilation, module: webpackNS.RuntimeModule, chunk: webpackNS.Chunk) => void)[];
    };
    const originAddRuntimeModule = compilation.addRuntimeModule as AddRuntimeModuleFn;
    if (!originAddRuntimeModule.rspack) {
      compilation.addRuntimeModule = function (this: webpackNS.Compilation, chunk, module, chunkGraph) {
        originAddRuntimeModule.call(this, chunk, module, chunkGraph);
        (compilation.addRuntimeModule as AddRuntimeModuleFn).rspack!.forEach((hook) => hook.call(this, module, chunk));
      } as AddRuntimeModuleFn;
      (compilation.addRuntimeModule as AddRuntimeModuleFn).rspack = [hook];
    } else {
      originAddRuntimeModule.rspack.push(hook);
    }
  } else {
    compilation.hooks.runtimeModule.tap(options, (module, chunk) => hook(module, chunk));
  }
}
