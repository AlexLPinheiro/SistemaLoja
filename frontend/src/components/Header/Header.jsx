// src/components/Header/Header.jsx
import React from 'react';
import './Header.css';
import logo from '../../assets/logo.png'; // Certifique-se que o logo está aqui

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <img src={logo} alt="Amei Importei Logo" className="header-logo" />
        <h1>AMEI IMPORTEI</h1>
      </div>
      <nav className="header-nav">
        <a href="#" className="nav-link active">Home</a>
        <a href="#" className="nav-link">Clientes</a>
        <a href="#" className="nav-link">Produtos</a>
        <a href="#" className="nav-link">Vendas</a>
      </nav>
    </header>
  );
};

export default Header;