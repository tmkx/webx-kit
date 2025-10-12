import { createRoot } from 'react-dom/client';
import { App } from './app';
import '../../tailwind.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);
