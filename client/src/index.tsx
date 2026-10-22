import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter as Router} from 'react-router-dom';
import App from './App';
import initLocale from './operations/initLocale';
import {GlobalStyles} from './providers/GlobalStyleProvider';
import reportWebVitals from './reportWebVitals';
// App component

void initLocale();

createRoot(document.getElementById('root')!).render(
  <Router>
    <GlobalStyles />
    <App />
  </Router>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
