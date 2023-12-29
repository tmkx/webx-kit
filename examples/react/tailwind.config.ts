import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.flex-center': { display: 'flex', 'align-items': 'center', 'justify-content': 'center' },
      });
    }),
  ],
};

export default config;
