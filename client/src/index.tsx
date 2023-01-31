import React from 'react';
import ReactDOM from 'react-dom';
import {createGlobalStyle} from 'styled-components';
import initLocale from './operations/initLocale';
import {BrowserRouter as Router} from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import './index.css';
// App component
import App from './App';

const GlobalStyles = createGlobalStyle`
  /* bug with react-scripts ~4.0.3 that overlays iframe after time */
  body {
    iframe:last-of-type {
      display: none !important;
    }
  }
`;

void initLocale();

ReactDOM.render(
  <Router>
    <GlobalStyles />
    <App />
  </Router>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
void reportWebVitals();
