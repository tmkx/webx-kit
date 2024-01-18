import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { ConfigProvider } from '@douyinfe/semi-ui';
import { isPageInDark } from '@webx-kit/runtime/content-scripts';
import { clsx } from 'clsx';

export const Provider = (props: React.PropsWithChildren<unknown>) => {
  const popupContainerRef = useRef<HTMLDivElement>(null);

  return (
    <ConfigProvider
      getPopupContainer={() => popupContainerRef.current || (window.__webxRoot as unknown as HTMLElement)}
    >
      {props.children}
      {window.__webxRoot
        ? createPortal(
            <div ref={popupContainerRef} className={clsx(isPageInDark() ? 'semi-always-dark' : null)} />,
            window.__webxRoot as unknown as HTMLElement
          )
        : null}
    </ConfigProvider>
  );
};
