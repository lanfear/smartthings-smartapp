import React from 'react';
import ReactDOM from 'react-dom';
import initLocale from './operations/initLocale';
import {BrowserRouter as Router} from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import './index.css';
// App component
import App from './App';

void initLocale();

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root')
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
void reportWebVitals();
