import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app';
import '../global.less';
import './style.less';

if (matchMedia('(prefers-color-scheme: dark)').matches) {
  document.body.classList.add('dark');
}
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
