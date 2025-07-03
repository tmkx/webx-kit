import type { Rspack } from '@rsbuild/core';
import { ROOT_NAME } from '../../constants';

const loader: Rspack.LoaderDefinition = function (code, sourceMap, additionalData) {
  this.callback(
    null,
    code.replace(/document\.querySelectorAll/g, `(globalThis.${ROOT_NAME}||document).querySelectorAll`),
    sourceMap,
    additionalData
  );
};

// @ts-expect-error CJS export
export = loader;
