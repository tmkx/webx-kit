import { HeadConfig, defineConfig } from 'vitepress';

const CLARITY_CODE = process.env.CLARITY_CODE;

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WebX Kit',
  description: 'A tool set for Web eXtension development',
  cleanUrls: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ...(CLARITY_CODE
      ? [
          [
            'script',
            {},
            `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_CODE}");`.trim(),
          ] satisfies HeadConfig,
        ]
      : []),
  ],
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
