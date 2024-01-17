import { FloatingElement, ReferenceElement, computePosition, flip, offset, shift } from '@floating-ui/dom';

export type { ClientRectObject } from '@floating-ui/dom';

export function position(reference: ReferenceElement, floating: FloatingElement) {
  return computePosition(reference, floating, {
    middleware: [offset(10), shift(), flip()],
  });
}
