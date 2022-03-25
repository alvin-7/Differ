import * as React from 'react';
// import * as ReactDOM from 'react-dom';
import './App.less';

import CodeDiffer from './pages/diff';

const App = () => {
  return (
    <div>
      <CodeDiffer></CodeDiffer>
    </div>
    // ReactDOM.render(<CodeDiffer></CodeDiffer>, document.body)
  );
};

export default App;
