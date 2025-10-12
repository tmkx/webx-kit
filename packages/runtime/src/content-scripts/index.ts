export * from './env';
export * from './position';
export * from './selection';

declare global {
  interface Window {
    __webxRoot?: SetWebxRootOptions['root'];
    __webxStyleRoot?: SetWebxRootOptions['styleRoot'];
  }
}

export interface SetWebxRootOptions {
  /**
   * @default `document`
   */
  root?: Document | ShadowRoot | null;
  /**
   * @default `document.head`
   */
  styleRoot?: Element | Document | ShadowRoot | null;
}

/**
 * enable CSS HMR support when rendering the app within shadow roots
 *
 * _designed for content-scripts_
 */
export function setWebxRoot(options: SetWebxRootOptions) {
  if (options.root !== undefined) {
    window.__webxRoot = options.root;
    window.__webxStyleRoot = options.root;
  }
  if (options.styleRoot !== undefined) window.__webxStyleRoot = options.styleRoot;
}

export interface CreateShadowRootUIOptions {
  styles?: string | string[];
  render(context: { root: HTMLElement }): void;
}

export function createShadowRootUI({ styles = [], render }: CreateShadowRootUIOptions) {
  const container = document.createElement('webx-root');
  const shadowRoot = container.attachShadow({ mode: 'open' });

  setWebxRoot({ root: shadowRoot });

  const styleElements = ([] as string[]).concat(styles).map(style => {
    const styleEl = document.createElement('link');
    styleEl.rel = 'stylesheet';
    styleEl.href = style;
    return styleEl;
  });

  const appRoot = document.createElement('div');
  render({ root: appRoot });

  Promise.all(styleElements.map(el => new Promise(resolve => el.addEventListener('load', resolve))))
    // render the app after the style has been loaded
    // https://en.wikipedia.org/wiki/Flash_of_unstyled_content
    .then(() => shadowRoot.append(appRoot));

  styleElements.forEach(styleEl => shadowRoot.append(styleEl));
  document.body.prepend(container);
}
