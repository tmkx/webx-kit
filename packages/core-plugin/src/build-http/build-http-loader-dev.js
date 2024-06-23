/** @type {import('jiti').default} */
const createJITI = require('jiti');

const jiti = createJITI(__filename, { requireCache: false });

module.exports = jiti('./build-http-loader.ts');
