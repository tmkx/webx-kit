import { createShadowRootUI } from '@webx-kit/runtime/content-scripts';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import '../tailwind.css';
import { ContainerProvider } from '@/components/provider';

createShadowRootUI({
  styles: chrome.runtime.getURL('static/css/content-script.css'),
  render({ root }) {
    createRoot(root).render(
      <ContainerProvider value={root}>
        <App />
      </ContainerProvider>
    );
  },
});
