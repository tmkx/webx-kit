import { createShadowRootUI } from '@webx-kit/runtime/content-scripts';
import { createApp } from 'vue';
import App from './App.vue';
import '../global.less';

createShadowRootUI({
  styles: chrome.runtime.getURL('static/css/content-script.css'),
  render({ root }) {
    createApp(App).mount(root);
  },
});
