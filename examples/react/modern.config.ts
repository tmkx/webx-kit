import { appTools, defineConfig } from '@modern-js/app-tools';

const isDev = process.env.NODE_ENV === 'development';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [appTools()],
  source: {
    entriesDir: './src/pages',
  },
  output: {
    disableInlineRuntimeChunk: true, // inline scripts are not allowed in MV3
    disableFilenameHash: true,
    copy: [
      {
        from: './src/manifest.json',
        to: './',
        transform(input) {
          const { $schema, ...manifest } = JSON.parse(input.toString('utf8'));
          return isDev ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
        },
      },
    ],
    polyfill: 'off',
  },
  tools: {
    devServer: {
      client: {
        host: '127.0.0.1',
      },
      devMiddleware: {
        writeToDisk(_file) {
          // return !file.includes('.hot-update.'); // default behavior
          return true; // write hot-update file to FS
        },
      },
    },
  },
});
