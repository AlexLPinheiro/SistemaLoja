// src/components/Sidebar/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Importe Link e useLocation
import { FaHome, FaUserFriends, FaBoxOpen, FaMoneyBillWave } from 'react-icons/fa';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: FaHome },
  { path: '/clientes', icon: FaUserFriends },
  { path: '/produtos', icon: FaBoxOpen },
  { path: '/vendas', icon: FaMoneyBillWave },
];

const Sidebar = () => {
  const location = useLocation();

  const isNavItemActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="app-sidebar">
      <ul className="sidebar-nav">
        {navItems.map(item => (
          <li key={item.path} className={`sidebar-nav-item ${isNavItemActive(item.path) ? 'active' : ''}`}>
            <Link to={item.path} className="sidebar-nav-link">
              <item.icon size={22} />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;