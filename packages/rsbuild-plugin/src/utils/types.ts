import type { Rspack } from '@rsbuild/core';

type RuntimeModuleHookParams = Parameters<Parameters<Rspack.Compilation['hooks']['runtimeModule']['tap']>[1]>;
export type JsRuntimeModule = RuntimeModuleHookParams[0];
