import { createRoot } from 'react-dom/client';
import { useAtom } from 'jotai/react';
import { apiKeyAtom } from '../../hooks/atoms';

const App = () => {
  const [apiKey, setAPIKey] = useAtom(apiKeyAtom);
  return (
    <div>
      <div data-testid="apiKey">{apiKey}</div>
      <button
        data-testid="change"
        onClick={() => {
          setAPIKey('Changed');
        }}
      >
        Change
      </button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
