import { defineManifest } from '@webx-kit/modernjs-plugin/manifest';

export default defineManifest(() => ({
  manifest_version: 3,
  name: 'Proxy Switchy Pi',
  version: '0.0.0',
  permissions: ['storage', 'proxy'],
  icons: {
    256: 'public/logo.png',
  },
  action: {
    default_popup: 'popup.html',
  },
  options_ui: {
    page: 'options.html',
    open_in_tab: true,
  },
}));
