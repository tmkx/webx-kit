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
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting Started', link: '/guide/' },
          { text: 'Messaging', link: '/guide/messaging' },
          { text: 'Storage', link: '/guide/storage' },
        ],
      },
      {
        text: 'Recipes',
        items: [{ text: 'Google Analytics', link: '/recipes/google-analytics' }],
      },
      {
        text: 'Miscellaneous',
        items: [{ text: 'Tips', link: '/misc/tips' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/tmkx/webx-kit' }],

    footer: {
      message: '🚧 Still under construction 🚧',
      copyright: 'Copyright © 2024-present Tmk',
    },

    editLink: {
      pattern: 'https://github.com/tmkx/webx-kit/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
