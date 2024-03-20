/** @type {import('@rsbuild/shared/jiti').default} */
const createJITI = require('@rsbuild/shared/jiti');

const jiti = createJITI(__filename, { requireCache: false });

module.exports = jiti('./shadow-root-loader.ts');
