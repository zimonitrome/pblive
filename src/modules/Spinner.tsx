// Spinner.tsx
import { Component } from 'solid-js';
import spinnerStyles from './Spinner.module.css';

const Spinner: Component = () => {
  return (
    <div class={spinnerStyles.spinnerContainer}>
      <div class={spinnerStyles.spinner}></div>
    </div>
  );
};

export default Spinner;