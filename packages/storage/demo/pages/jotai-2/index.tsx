import { createRoot } from 'react-dom/client';
import { useAtomValue } from 'jotai/react';
import { apiKeyAtom } from '../../shared/atoms';

const App = () => {
  const apiKey = useAtomValue(apiKeyAtom);
  return (
    <div>
      <div data-testid="apiKey">{apiKey}</div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
