import { Rspack } from '@rsbuild/shared';

type RuntimeModuleHookParams = Parameters<Parameters<Rspack.Compilation['hooks']['runtimeModule']['tap']>[1]>;
export type JsRuntimeModule = RuntimeModuleHookParams[0];
export type JsChunk = RuntimeModuleHookParams[1];
