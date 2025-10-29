import { createSignal } from 'solid-js';
import logo from '@/assets/text-logo.svg';
import { Hello } from './hello';

export const App = () => {
  const [count, setCount] = createSignal(0);
  return (
    <div class="flex-center fixed right-16 bottom-16 z-10 flex-col rounded-xl bg-slate-200 px-6 py-4 text-base">
      <img class="h-5" src={logo} alt="Logo" />
      <div>
        <span class="text-slate-700 dark:text-slate-400">Count: </span>
        <button class="text-sky-700 tabular-nums" onClick={() => setCount(count() + 1)}>
          {count()}
        </button>
      </div>
      <Hello />
    </div>
  );
};
