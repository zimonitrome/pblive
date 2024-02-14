import type { Component } from 'solid-js';

import styles from './App.module.css';
// import { MyChart } from './modules/MyChart';
import { MyChart2 } from './modules/MyChart';
import Spinner from './modules/Spinner';

const App: Component = () => {
  return (
    <div class={styles.App}>
      {/* <header class={styles.header}></header> */}
      {/* <MyChart /> */}
      <MyChart2 />
    </div>
  );
};

export default App;
