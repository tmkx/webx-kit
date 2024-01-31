import { Popover, Tooltip } from '@radix-ui/themes';
import { MutableRefObject, createContext, forwardRef, useContext } from 'react';
import { createPortal } from 'react-dom';

const PortalContainerContext = createContext<MutableRefObject<HTMLDivElement | null>>({ current: null });

export const Provider = (props: React.PropsWithChildren<unknown>) => {
  const portalContainerContextRef = useContext(PortalContainerContext);

  return (
    <>
      {props.children}
      {window.__webxRoot
        ? createPortal(<div ref={portalContainerContextRef} />, window.__webxRoot as unknown as HTMLElement)
        : null}
    </>
  );
};

export const ScopedTooltip = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Tooltip>>(
  (props, ref) => {
    const { current } = useContext(PortalContainerContext);
    return <Tooltip ref={ref} container={current} {...props} />;
  }
);

export const ScopedPopoverContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<(typeof Popover)['Content']>
>((props, ref) => {
  const { current } = useContext(PortalContainerContext);
  return <Popover.Content ref={ref} container={current} {...props} />;
});
