import React from 'react';
import './../CHead/Header.scss';
import logo from './../../../img/Clogo.svg';
import Navigation from '../CMenu/Menu';
import { Link } from 'react-router-dom';

function Nav() {
  return (
    <header className="navigation">
      <div className="header-row">
        <Link to="/home-page" className="navigation-logo">
          <img className="logo-png"src={logo}  alt="logo" />
        </Link>
        <Navigation />
      </div>
    </header>
  );
}

export default Nav;