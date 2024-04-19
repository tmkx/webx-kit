import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WebX Kit',
  description: 'A tool set for Web eXtension development',
  cleanUrls: true,
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
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
        items: [
          { text: 'Getting Started', link: '/guide/' },
          { text: 'Messaging', link: '/guide/messaging' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/tmkx/webx-kit' }],

    footer: {
      message: '🚧 Still under construction 🚧',
      copyright: 'Copyright © 2024-present Tmk',
    },
  },
});
