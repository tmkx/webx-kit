import {
  ComputePositionConfig,
  FloatingElement,
  OffsetOptions,
  ReferenceElement,
  computePosition as computePositionFloatingUI,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';

export type { ClientRectObject } from '@floating-ui/dom';

export interface ComputePositionOptions extends Omit<Partial<ComputePositionConfig>, 'middleware'> {
  offset?: OffsetOptions | false;
}

export function computePosition(
  reference: ReferenceElement,
  floating: FloatingElement,
  options?: ComputePositionOptions
) {
  const { offset: offsetOptions } = options || {};
  return computePositionFloatingUI(reference, floating, {
    ...options,
    middleware: [offsetOptions !== false && offset(offsetOptions || 10), shift(), flip()],
  });
}
