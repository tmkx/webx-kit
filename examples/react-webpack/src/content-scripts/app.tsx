import { useState } from 'react';
import logo from '@/assets/text-logo.svg';
import { Hello } from './hello';

export const App = () => {
  const [count, setCount] = useState(0);
  return (
    <div className="fixed z-10 right-16 bottom-16 text-base flex-center flex-col bg-slate-200 px-6 py-4 rounded-xl">
      <img className="h-5" src={logo} alt="Logo" />
      <div>
        <span className="text-slate-700 dark:text-slate-400">Count: </span>
        <button className="text-sky-700 tabular-nums" onClick={() => setCount(count + 1)}>
          {count}
        </button>
      </div>
      <Hello />
    </div>
  );
};
