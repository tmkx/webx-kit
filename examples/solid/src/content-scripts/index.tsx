import { setWebxRoot } from '@webx-kit/runtime/content-scripts';
import { render } from 'solid-js/web';
import { App } from './app';
import '../global.less';

const container = document.createElement('webx-root');
const shadowRoot = container.attachShadow({ mode: 'open' });

setWebxRoot({ root: shadowRoot });

const styleEl = document.createElement('link');
styleEl.rel = 'stylesheet';
styleEl.href = chrome.runtime.getURL('static/css/content-script.css');

const appRoot = document.createElement('div');
render(() => <App />, appRoot);

// render the app after the style has been loaded
styleEl.addEventListener('load', () => shadowRoot.append(appRoot));

shadowRoot.append(styleEl);
document.body.prepend(container);
