const isDev = process.env.NODE_ENV === 'development';

const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'WebX Kit Svelte Demo',
  version: '0.0.0',
  icons: {
    512: 'public/logo.png',
  },
  background: {
    service_worker: 'static/js/background.js',
    type: 'module',
  },
  action: {
    default_popup: 'popup.html',
  },
  options_ui: {
    page: 'options.html',
    open_in_tab: true,
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['static/js/content-script.js'],
      run_at: 'document_idle',
    },
  ],
  host_permissions: ['<all_urls>'],
  web_accessible_resources: [
    {
      matches: ['<all_urls>'],
      resources: ['static/css/*', 'static/svg/*'],
    },
  ],

  ...(isDev
    ? {
        content_security_policy: {
          extension_pages: `script-src 'self' http://localhost:${process.env.PORT}/; object-src 'self' http://localhost:${process.env.PORT}/`,
        },
      }
    : {}),
};

export default manifest;
