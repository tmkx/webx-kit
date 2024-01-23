import { createRoot } from 'react-dom/client';
import { useUnstorage } from '../../shared/unstorage';

const App = () => {
  const [apiKey] = useUnstorage('apiKey', 'DEFAULT');
  return (
    <div>
      <div data-testid="apiKey">{apiKey}</div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
