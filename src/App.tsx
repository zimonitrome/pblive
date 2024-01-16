import type { Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import { MyChart } from './modules/MyChart';

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <MyChart />
      </header>
    </div>
  );
};

export default App;
