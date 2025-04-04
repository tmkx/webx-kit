import { RefObject, createContext, useContext } from 'react';

export const PortalContainerContext = createContext<RefObject<HTMLDivElement | null>>({ current: null });

export const usePortalContainer = () =>
  (useContext(PortalContainerContext).current || window.__webxRoot?.lastElementChild || undefined) as
    | Element
    | undefined;
