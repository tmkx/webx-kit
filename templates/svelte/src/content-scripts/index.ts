import { createShadowRootUI } from '@webx-kit/runtime/content-scripts';
import App from './app.svelte';
import '../tailwind.css';

createShadowRootUI({
  styles: chrome.runtime.getURL('static/css/content-script.css'),
  render({ root }) {
    new App({ target: root });
  },
});
