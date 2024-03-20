import type { webpack as webpackNS } from '@modern-js/app-tools';
import { ROOT_NAME } from '@webx-kit/core-plugin/constants';

const loader: webpackNS.LoaderDefinition = function (code, sourceMap, additionalData) {
  this.callback(
    null,
    code.replace(/document\.querySelectorAll/g, `(globalThis.${ROOT_NAME}||document).querySelectorAll`),
    sourceMap,
    additionalData
  );
};

// @ts-expect-error CJS export
export = loader;
