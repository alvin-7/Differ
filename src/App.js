import React from 'react';
import { BrowserRouter as Router, Route, NavLink, Routes } from 'react-router-dom';
import './App.css';

import Home from './pages/home';
import About from './pages/about';

// 入口app
const App = () => {
  return (
    <Router>
      <header className="header">
        <NavLink to="/">首页<br></br></NavLink>
        <NavLink to="/about">关于我们</NavLink>
      </header>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/about" element={<About/>} />
      </Routes>
    </Router>
  );
};

export default App;