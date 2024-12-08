import { createShadowRootUI } from '@webx-kit/runtime/content-scripts';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import '../global.less';
import { StyleProvider } from '@ant-design/cssinjs';

createShadowRootUI({
  styles: chrome.runtime.getURL('static/css/content-script.css'),
  render({ root }) {
    createRoot(root).render(
      <StyleProvider container={root}>
        <App />
      </StyleProvider>
    );
  },
});
