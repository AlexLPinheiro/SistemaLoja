// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import HomePage from './pages/HomePage/HomePage';
import ClientsListPage from './pages/ClientsListPage/ClientsListPage';
import ClientDetailPage from './pages/ClientDetailPage/ClientDetailPage';
import AddClientPage from './pages/AddClientPage/AddClientPage';
import ProductsListPage from './pages/ProductsListPage/ProductsListPage'; 
import SalesListPage from './pages/SalesListPage/SalesListPage';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Header />
      <Sidebar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clientes" element={<ClientsListPage />} />
        <Route path="/clientes/novo" element={<AddClientPage />} />
        <Route path="/clientes/:clientId" element={<ClientDetailPage />} />
        <Route path="/produtos" element={<ProductsListPage />} />
        <Route path="/vendas" element={<SalesListPage />} />
        <Route path="*" element={<div>Página não encontrada</div>} />
      </Routes>
    </div>
  );
}

export default App;