import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// import App from './pages/table_virtual/virtualTable';
import { Provider } from 'react-redux'
import store from './redux/store'

import './index.less';

ReactDOM.render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('root'),
);