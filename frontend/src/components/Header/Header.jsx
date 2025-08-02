import React from 'react';
import { NavLink } from 'react-router-dom'; // Garante que o NavLink seja importado
import './Header.css';
import logo from '../../assets/logo.png';

// Estrutura de dados para os links, para manter o código limpo
const navItems = [
    { path: '/', label: 'Home' },
    { path: '/clientes', label: 'Clientes' },
    { path: '/produtos', label: 'Produtos' },
    { path: '/vendas', label: 'Vendas' },
];

const Header = () => {
    return (
        <header className="app-header">
            <div className="header-brand">
                <img src={logo} alt="Amei Importei Logo" className="header-logo" />
                <h1>AMEI IMPORTEI</h1>
            </div>
            <nav className="header-nav">
                {/* Mapeia sobre os itens para criar os links dinamicamente */}
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        // O NavLink nos dá 'isActive' para aplicar a classe 'active' dinamicamente
                        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
};

export default Header;