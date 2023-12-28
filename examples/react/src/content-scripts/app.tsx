import { useState } from 'react';
import styles from './styles.module.less';

export const App = () => {
  const [count, setCount] = useState(0);
  return (
    <div className={styles.container}>
      <span>Count: </span>
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </div>
  );
};
