import { createShadowRootUI } from '@webx-kit/runtime/content-scripts';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import '../global.less';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';

createShadowRootUI({
  styles: chrome.runtime.getURL('static/css/content-script.css'),
  render({ root }) {
    createRoot(root).render(
      <StyleProvider container={root}>
        <ConfigProvider getPopupContainer={() => root}>
          <App />
        </ConfigProvider>
      </StyleProvider>
    );
  },
});
