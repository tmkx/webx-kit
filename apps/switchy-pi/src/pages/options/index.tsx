import { createRoot } from 'react-dom/client';
import { App } from './app';
import '../global.less';
import './style.less';

createRoot(document.getElementById('root')!).render(<App />);
