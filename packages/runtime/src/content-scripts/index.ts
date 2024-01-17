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
