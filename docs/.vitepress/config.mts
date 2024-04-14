import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WebX Kit',
  description: 'A tool set for Web eXtension development',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      src: '/logo.svg',
      alt: 'WebX Kit Logo',
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: 'https://github.com/tmkx/webx-kit/tree/main/examples' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [{ text: 'Getting Started', link: '/guide/' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/tmkx/webx-kit' }],
  },
});
