import { createRoot } from 'react-dom/client';
import { App } from './app';

declare global {
  interface Window {
    __webxRoot?: DocumentOrShadowRoot;
    __webxStyleRoot?: Element;
  }
}

const container = document.createElement('div');
const shadowRoot = (window.__webxRoot = container.attachShadow({ mode: 'open' }));
const styleRoot = (window.__webxStyleRoot = document.createElement('div'));
const appRoot = document.createElement('div');

const styleEl = document.createElement('link');
styleEl.rel = 'stylesheet';
styleEl.href = chrome.runtime.getURL('static/css/content-script.css');
styleRoot.append(styleEl);

createRoot(appRoot).render(<App />);

shadowRoot.append(styleRoot);
shadowRoot.append(appRoot);

document.body.prepend(container);
