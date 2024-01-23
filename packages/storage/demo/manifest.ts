const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'WebX Kit Storage',
  version: '0.0.0',
  permissions: ['storage'],
  background: {
    service_worker: 'static/js/background.js',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['static/js/content-script.js'],
      run_at: 'document_idle',
    },
  ],
  host_permissions: ['<all_urls>'],
};

export default manifest;
