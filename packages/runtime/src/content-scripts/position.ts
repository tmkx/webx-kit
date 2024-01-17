import {
  ComputePositionConfig,
  FlipOptions,
  FloatingElement,
  OffsetOptions,
  ReferenceElement,
  ShiftOptions,
  computePosition as computePositionDOM,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';

export type { AutoUpdateOptions as AutoUpdatePositionOptions } from '@floating-ui/dom';
export { autoUpdate as autoUpdatePosition } from '@floating-ui/dom';

export interface MiddlewareOptions {
  offset?: OffsetOptions | false;
  shift?: ShiftOptions | false;
  flip?: FlipOptions | false;
}

export function rangeToReference(range: Range): ReferenceElement {
  const contextElement = range.commonAncestorContainer;
  return {
    getBoundingClientRect: range.getBoundingClientRect.bind(range),
    contextElement: contextElement instanceof Element ? contextElement : contextElement.parentElement || undefined,
  };
}

export interface ComputePositionOptions extends Omit<Partial<ComputePositionConfig>, 'middleware'>, MiddlewareOptions {}

export function computePosition(
  reference: ReferenceElement,
  floating: FloatingElement,
  options?: ComputePositionOptions
) {
  const { offset: offsetOptions, shift: shiftOptions, flip: flipOptions } = options || {};
  return computePositionDOM(reference, floating, {
    ...options,
    middleware: [
      offsetOptions !== false && offset(offsetOptions ?? 10),
      shiftOptions !== false && shift(shiftOptions || { padding: 10 }),
      flipOptions !== false && flip(flipOptions),
    ],
  });
}
