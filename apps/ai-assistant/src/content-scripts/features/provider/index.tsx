import { PortalContainerContext } from '@/components/shared';
import { isPageInDark } from '@webx-kit/runtime/content-scripts';
import { useContext } from 'react';
import { createPortal } from 'react-dom';

export const Provider = (props: React.PropsWithChildren<unknown>) => {
  const portalContainerContextRef = useContext(PortalContainerContext);

  return (
    <>
      {props.children}
      {window.__webxRoot
        ? createPortal(
            <div ref={portalContainerContextRef} className={isPageInDark() ? 'dark' : undefined} />,
            window.__webxRoot as unknown as HTMLElement
          )
        : null}
    </>
  );
};
