import { createRoot } from 'react-dom/client';
import { useUnstorage } from '../../shared/unstorage';

const App = () => {
  const [apiKey, setAPIKey] = useUnstorage('apiKey', 'DEFAULT');
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
