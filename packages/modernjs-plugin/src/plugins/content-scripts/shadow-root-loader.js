// @ts-check

/** @type {import('@modern-js/app-tools').webpack.LoaderDefinition} */
const loader = function (code, sourceMap, additionalData) {
  const callback = this.async();

  import('./constants.mjs').then(({ ROOT_NAME }) => {
    callback(
      null,
      code.replace(/document\.querySelectorAll/g, `(globalThis.${ROOT_NAME}||document).querySelectorAll`),
      sourceMap,
      additionalData
    );
  });
};

module.exports = loader;
