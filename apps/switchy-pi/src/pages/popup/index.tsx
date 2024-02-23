import { createRoot } from 'react-dom/client';
import { App } from './app';
import '../global.less';

if (matchMedia('(prefers-color-scheme: dark)').matches) {
  document.body.classList.add('dark');
}
createRoot(document.getElementById('root')!).render(<App />);
