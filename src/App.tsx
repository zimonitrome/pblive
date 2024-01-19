import type { Component } from 'solid-js';

import styles from './App.module.css';
import { MyChart } from './modules/MyChart';

const App: Component = () => {
  return (
    <div class={styles.App}>
      {/* <header class={styles.header}></header> */}
      <MyChart />
    </div>
  );
};

export default App;
