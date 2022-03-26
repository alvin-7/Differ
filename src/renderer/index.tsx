// // Add this to the end of the existing file
import './index.less';
// import React from 'react';
// import ReactDOM from 'react-dom';
import App from './App';
import { Provider } from 'react-redux'
import store from './redux/store'

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <Provider store={store}>
    <App></App>
  </Provider>,
  document.getElementById('root'),
);