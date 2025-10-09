import { createRoot } from 'react-dom/client';
import { getDefaultStore } from 'jotai';
import { isDarkAtom } from '@/atoms/config';
import { Provider } from '@/features/provider';
import { App } from './app';
import '../tailwind.css';

if (getDefaultStore().get(isDarkAtom)) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <Provider>
    <App />
  </Provider>
);
