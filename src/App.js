import React from 'react';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import './App.css';

import Home from './pages/home'
import About from './pages/about'

function App() {
  return (
    <Router>
      <header className='header'>
        <NavLink to='/'>首页</NavLink>
        <NavLink to='/about'>关于我们</NavLink>
      </header>
      <div className='App'>
        <Route exact path='/' component={Home} />
        <Route path='/about' component={About} />
      </div>
    </Router>
  );
}

export default App;
