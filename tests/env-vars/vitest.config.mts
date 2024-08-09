import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: './tests',
    ...(process.env.NX_CLI_SET === 'true'
      ? {
          watch: false,
        }
      : null),
  },
});
