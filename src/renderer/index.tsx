import React from 'react';
import ReactDOM from 'react-dom';
import ModernApp from './ModernApp';
// import App from './pages/table_virtual/virtualTable';
import { Provider } from 'react-redux'
import store from './redux/store'

import './index.less';

ReactDOM.render(
  <Provider store={store}>
    <ModernApp/>
  </Provider>,
  document.getElementById('root'),
);