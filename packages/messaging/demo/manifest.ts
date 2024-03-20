const isDev = process.env.NODE_ENV === 'development';

const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'WebX Kit Messaging',
  version: '0.0.0',
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
  host_permissions: ['<all_urls>'],

  ...(isDev
    ? {
        content_security_policy: {
          extension_pages: `script-src 'self' http://localhost:${process.env.PORT}/; object-src 'self' http://localhost:${process.env.PORT}/`,
        },
      }
    : {}),
};

export default manifest;
