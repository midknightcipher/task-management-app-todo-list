import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // 🆕 IMPORT REDUX PROVIDER
import { store } from './store'; // 🆕 IMPORT YOUR CONFIGURED STORE
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}> {/* 🆕 WRAP THE APP */}
      <App />
    </Provider>
  </React.StrictMode>
);