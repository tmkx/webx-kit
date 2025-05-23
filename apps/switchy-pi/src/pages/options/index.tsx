import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { getDefaultStore } from 'jotai';
import { isDarkAtom } from '@/atoms/config';
import { Provider } from '@/features/provider';
import { router } from './app';
import '../styles.css';
import './styles.css';

if (getDefaultStore().get(isDarkAtom)) {
  document.documentElement.classList.add('dark');
}
createRoot(document.getElementById('root')!).render(
  <Provider>
    <RouterProvider router={router} />
  </Provider>
);
