import { createShadowRootUI } from '@webx-kit/runtime/content-scripts';
import { render } from 'solid-js/web';
import { App } from './app';
import '../styles.css';

createShadowRootUI({
  styles: chrome.runtime.getURL('static/css/content-script.css'),
  render({ root }) {
    render(() => <App />, root);
  },
});
