import { useState } from 'react';

export const App = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span>Count: </span>
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </div>
  );
};
