const isDev = process.env.NODE_ENV === 'development';

const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'webx-kit-demo',
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
      resources: ['static/css/*'],
    },
  ],

  ...(isDev
    ? {
        content_security_policy: {
          extension_pages: "script-src 'self' http://localhost:8080/; object-src 'self' http://localhost:8080/",
        },
      }
    : {}),
};

export default manifest;
