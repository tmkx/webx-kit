import type { Rspack } from '@rsbuild/core';

// https://github.com/web-infra-dev/rsbuild/blob/4fa7e847ec66f6f0c5f5518e46185ee69ad0b819/packages/core/src/server/helper.ts#L464-L470
const COMPILATION_ID_REGEX = /[^a-zA-Z0-9_-]/g;
export const getCompilationId = (compiler: Rspack.Compiler | Rspack.Compilation) => {
  const uniqueName = compiler.options.output.uniqueName ?? '';
  return `${compiler.name ?? ''}_${uniqueName.replace(COMPILATION_ID_REGEX, '_')}`;
};
