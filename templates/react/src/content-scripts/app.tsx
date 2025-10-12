import { useState } from 'react';
import logo from '@/assets/text-logo.svg';
import { Hello } from './hello';

export const App = () => {
  const [count, setCount] = useState(0);
  return (
    <div className="flex-center fixed bottom-16 right-16 z-10 flex-col rounded-xl bg-slate-200 px-6 py-4 text-base">
      <img className="h-5" src={logo} alt="Logo" />
      <div>
        <span className="text-slate-700 dark:text-slate-400">Count: </span>
        <button className="tabular-nums text-sky-700" onClick={() => setCount(count + 1)}>
          {count}
        </button>
      </div>
      <Hello />
    </div>
  );
};
