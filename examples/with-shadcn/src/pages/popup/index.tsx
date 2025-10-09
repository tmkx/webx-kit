import { createRoot } from 'react-dom/client';
import { App } from './app';
import '../../tailwind.css';

createRoot(document.getElementById('root')!).render(
  <div className="min-w-96 p-4">
    <App />
  </div>
);
