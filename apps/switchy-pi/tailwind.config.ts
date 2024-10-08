import { getPixelUnitDefaultTheme } from '@webx-kit/rsbuild-plugin/tailwind';
import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: getPixelUnitDefaultTheme(),
  plugins: [
    require('tailwindcss-react-aria-components'),
    require('tailwindcss-animate'),
    plugin(({ addUtilities }) => {
      addUtilities({
        '.flex-center': { display: 'flex', 'align-items': 'center', 'justify-content': 'center' },
      });
    }),
  ],
};

export default config;
