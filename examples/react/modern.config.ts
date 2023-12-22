import { appTools, defineConfig } from '@modern-js/app-tools';

const isDev = process.env.NODE_ENV === 'development';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [appTools()],
  source: {
    entriesDir: './src/pages',
  },
  dev: {
    assetPrefix: true,
  },
  output: {
    disableInlineRuntimeChunk: true, // inline scripts are not allowed in MV3
    disableFilenameHash: true,
    copy: [
      {
        from: './src/manifest.ts',
        to: './manifest.json',
        async transform(_input, filename) {
          const manifest = await evalFile(filename);
          return isDev ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);
        },
      },
    ],
    polyfill: 'off',
  },
  tools: {
    devServer: {
      client: {
        host: 'localhost',
      },
    },
  },
});

async function evalFile(filename: string) {
  const { default: createJITI } = await import('jiti');
  const jiti = createJITI(__filename, { interopDefault: true });
  return jiti(filename);
}
