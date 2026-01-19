import path from 'node:path';
import type { Rspack } from '@rsbuild/core';
import { ROOT_NAME, STYLE_ROOT_NAME } from '../../constants';

export const PLUGIN_NAME = 'webx:content-script-shadow-root';

const shadowRootLoader = path.resolve(
  __dirname,
  process.env.NODE_ENV === 'development' ? 'shadow-root-loader-dev.cjs' : 'shadow-root-loader.cjs'
);

export class CSSExtractPatchPlugin {
  constructor(readonly resourceRegExp: RegExp) {}

  apply(compiler: Rspack.Compiler) {
    new compiler.webpack.NormalModuleReplacementPlugin(this.resourceRegExp, resolveData => {
      resolveData.request = `${shadowRootLoader}!${resolveData.request}`;
    }).apply(compiler);
  }
}

export function patchCSSLoadingCode(code: string): string {
  return code
    .replace(
      /document\.(querySelectorAll|getElementsByTagName)/g,
      // if ROOT_NAME is a ShadowRoot, there is no getElementsByTagName method
      `(globalThis.${ROOT_NAME}||document).querySelectorAll`
    )
    .replace(/document\.head/g, `(globalThis.${STYLE_ROOT_NAME}||document.head)`);
}
