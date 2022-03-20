import React, {useState} from 'react';
import { Button } from 'antd';
import { BrowserRouter as Router, Route, NavLink, Routes } from 'react-router-dom';
import './App.less';

import ExcelDiffer from './pages/excel';
import CodeDiffer from './pages/diff';

// 入口app
const App = () => {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <header className="header">
        <NavLink to="/">
          <Button type='primary' onClick={()=>setCount(count+1)}>首页{count}</Button>
        </NavLink>
        <NavLink to="/about">
          <Button type='primary'>关于我们</Button>
        </NavLink>
      </header>
      <Routes>
        <Route path="/" element={<ExcelDiffer/>} />
        <Route path="/about" element={<CodeDiffer/>} />
      </Routes>
    </Router>
  );
};

export default App;