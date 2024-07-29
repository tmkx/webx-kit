import { defineManifest } from '@webx-kit/rsbuild-plugin/manifest';

export default defineManifest(() => ({
  manifest_version: 3,
  name: 'WebX Kit React Rsbuild Demo',
  version: '0.0.0',
  icons: {
    512: 'public/logo.png',
  },
  action: {
    default_popup: 'popup.html',
  },
  options_ui: {
    page: 'options.html',
    open_in_tab: true,
  },
  host_permissions: ['<all_urls>'],
  web_accessible_resources: [
    {
      matches: ['<all_urls>'],
      resources: ['static/css/*', 'static/svg/*'],
    },
  ],
}));
