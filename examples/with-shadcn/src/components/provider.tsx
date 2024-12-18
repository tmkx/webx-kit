import { createContext } from 'react';

export const ContainerProvider = createContext<HTMLElement>(document.body);
