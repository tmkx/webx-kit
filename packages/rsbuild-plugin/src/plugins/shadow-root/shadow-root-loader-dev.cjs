const { createJiti } = require('jiti');

const jiti = createJiti(__filename, { moduleCache: false });

module.exports = jiti('./shadow-root-loader.ts');
