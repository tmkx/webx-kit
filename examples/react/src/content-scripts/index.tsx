import { createRoot } from 'react-dom/client';
import { App } from './app';

const root = document.createElement('div');

createRoot(root).render(<App />);

document.body.prepend(root);
