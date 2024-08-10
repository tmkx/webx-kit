import type { Rspack } from '@rsbuild/shared';

type RuntimeModuleHookParams = Parameters<Parameters<Rspack.Compilation['hooks']['runtimeModule']['tap']>[1]>;
export type JsRuntimeModule = RuntimeModuleHookParams[0];
