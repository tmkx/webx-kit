import type { ComputePositionReturn, FloatingElement } from '@floating-ui/dom';
import { type ComputePositionOptions, autoUpdatePosition, computePosition, rangeToReference } from './position';

function isSelectionValid(selection?: Selection | null): selection is Selection {
  return !!selection && !selection.isCollapsed;
}

export interface CreateSelectionMenuOptions {
  /**
   * Selection container
   *
   * @default `document`
   */
  container?: HTMLElement | Document;
  ignore?: EventTarget | null;
  getFloating?: () => FloatingElement | null;
  positionOptions?: ComputePositionOptions;
  onVisibleChange?: (visible: boolean) => void;
  onRangeChange?: (range: Range) => void;
  onPositionChange?: (position: ComputePositionReturn) => void | Promise<void>;
}

export function unstable_createSelectionMenu({
  container = document,
  ignore,
  getFloating,
  positionOptions,
  onVisibleChange,
  onRangeChange,
  onPositionChange,
}: CreateSelectionMenuOptions): VoidFunction {
  const ac = new AbortController();
  let visible = false;
  let range: Range | undefined;
  let positionDisposer: VoidFunction | undefined;

  function show(newRange: Range) {
    if (!visible) onVisibleChange?.(true);
    visible = true;
    if (newRange === range) return;
    onRangeChange?.((range = newRange));
    positionDisposer?.();
    const floating = getFloating?.();
    if (!floating) return;
    positionDisposer = autoUpdatePosition(rangeToReference(newRange), floating, () => {
      computePosition(newRange, floating, positionOptions).then(onPositionChange);
    });
    // selection can be changed by "Shift + Arrow"
    container.removeEventListener('selectionchange', updateSelection);
    container.addEventListener('selectionchange', updateSelection);
  }

  function hide() {
    if (!visible) return;
    visible = false;
    onVisibleChange?.(false);
    positionDisposer?.();
    positionDisposer = range = undefined;
    container.removeEventListener('selectionchange', updateSelection);
  }

  function updateSelection() {
    const selection = getSelection();
    if (isSelectionValid(selection)) {
      const newRange = selection.getRangeAt(0);
      if (/\S/.test(newRange.toString())) show(newRange);
      else hide();
    } else {
      hide();
    }
  }

  container.addEventListener(
    'mouseup',
    async (ev) => {
      if (ignore && ev.composedPath().includes(ignore)) return;
      // getSelection after a tick, because the selection may be cleared after "mouseup"
      await new Promise((resolve) => setTimeout(resolve));
      updateSelection();
    },
    { signal: ac.signal }
  );
  container.addEventListener('contextmenu', hide, { signal: ac.signal });
  return () => {
    ac.abort();
    positionDisposer?.();
    container.removeEventListener('selectionchange', updateSelection);
  };
}
