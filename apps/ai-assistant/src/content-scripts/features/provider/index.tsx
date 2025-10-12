import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { UNSAFE_PortalProvider } from '@react-aria/overlays';
import { isPageInDark } from '@webx-kit/runtime/content-scripts';

export const Provider = (props: React.PropsWithChildren) => {
  const portalContainerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <UNSAFE_PortalProvider getContainer={() => portalContainerRef.current}>{props.children}</UNSAFE_PortalProvider>
      {window.__webxRoot
        ? createPortal(
            <div ref={portalContainerRef} className={isPageInDark() ? 'dark' : undefined} />,
            window.__webxRoot as unknown as HTMLElement
          )
        : null}
    </>
  );
};
