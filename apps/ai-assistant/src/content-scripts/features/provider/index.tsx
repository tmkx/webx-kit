import { PortalContainerContext } from '@/components/shared';
import { useContext } from 'react';
import { createPortal } from 'react-dom';

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
