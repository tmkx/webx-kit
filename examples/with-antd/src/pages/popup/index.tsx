import { createRoot } from 'react-dom/client';
import { App } from './app';
import '../../styles.css';

createRoot(document.getElementById('root')!).render(
  <div className="min-w-96 px-4 pb-4">
    <App />
  </div>
);
