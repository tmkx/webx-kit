import { setWebxRoot } from '@webx-kit/runtime/content-scripts';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import '../global.less';

const container = document.createElement('webx-root');
const shadowRoot = container.attachShadow({ mode: 'open' });

setWebxRoot({ root: shadowRoot });

const styleEl = document.createElement('link');
styleEl.rel = 'stylesheet';
styleEl.href = chrome.runtime.getURL('static/css/content-script.css');

const appRoot = document.createElement('div');
createRoot(appRoot).render(<App />);

// render the app after the style has been loaded
styleEl.addEventListener('load', () => shadowRoot.append(appRoot));

shadowRoot.append(styleEl);
container.style.setProperty('position', 'fixed');
container.style.setProperty('left', '0');
container.style.setProperty('top', '0');
container.style.setProperty('z-index', '2147483647');
document.body.prepend(container);
