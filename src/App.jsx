import React from 'react';
import { Button } from 'antd';
import { BrowserRouter as Router, Route, NavLink, Routes } from 'react-router-dom';
import './App.less';

import Home from './pages/home';
import About from './pages/about';

// 入口app
const App = () => {
  return (
    <Router>
      <header className="header">
        <NavLink to="/">
          <Button type='primary'>首页</Button>
        </NavLink>
        <NavLink to="/about">
          <Button type='primary'>关于我们</Button>
        </NavLink>
      </header>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/about" element={<About/>} />
      </Routes>
    </Router>
  );
};

export default App;