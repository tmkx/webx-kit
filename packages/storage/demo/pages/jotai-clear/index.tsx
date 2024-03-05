import { createRoot } from 'react-dom/client';
import { useAtom } from 'jotai/react';
import { apiKeyAtom } from '../../shared/atoms';

const App = () => {
  const [apiKey, setAPIKey] = useAtom(apiKeyAtom);
  return (
    <div>
      <div data-testid="apiKey">{apiKey}</div>
      <button data-testid="change" onClick={() => setAPIKey('Changed')} />
      <button data-testid="clear" onClick={() => chrome.storage.local.clear()} />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
