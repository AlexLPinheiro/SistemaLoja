import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';

// Componentes e Serviços
import StatusPill from '../../components/StatusPill/StatusPill';
import api from '../../services/api';

// Estilos
import './SalesListPage.css';
import '../../styles/table.css';

const SalesListPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Funções de formatação e lógica de cores
    const formatPaymentMethod = (method) => {
        if (method === 'a_vista') return 'À Vista';
        return method.charAt(0).toUpperCase() + method.slice(1);
    };

    const formatStatus = (status) => {
        const translations = {
            'nao_pago': 'Não Pago', 'em_atraso': 'Em Atraso',
            'pago': 'Pago', 'em_dia': 'Em Dia',
            'nao_entregue': 'Não Entregue', 'entregue': 'Entregue'
        };
        return translations[status] || status;
    };
    
    const getStatusPillType = (status) => {
        switch (status) {
            case 'pago':
            case 'entregue':
            case 'em_dia':
                return 'success'; // Verde
            case 'nao_pago':
            case 'nao_entregue':
            case 'em_atraso':
            default:
                return 'info'; // Roxo/Lavanda
        }
    };

    const formatCurrency = (value) => {
        if (isNaN(value)) return 'R$ 0,00';
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // useEffect para buscar os pedidos com base na pesquisa (com debounce)
    useEffect(() => {
        const fetchSales = async (query) => {
            try {
                setLoading(true);
                const response = await api.get('/pedidos/', {
                    params: { search: query }
                });
                setSales(response.data);
            } catch (error) {
                console.error("Falha ao buscar vendas:", error);
            } finally {
                setLoading(false);
            }
        };

        const timerId = setTimeout(() => {
            fetchSales(searchQuery);
        }, 500);

        return () => clearTimeout(timerId);
    }, [searchQuery]);

    return (
        <main className="main-content">
            <div className="page-header">
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Pesquise pelo nome do cliente"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Data do Pedido</th>
                            <th>Método de Pagamento</th>
                            <th>Parcelamento</th>
                            <th>Status do Pagamento</th>
                            <th>Status da Entrega</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Carregando vendas...</td></tr>
                        ) : (
                            sales.length > 0 ? (
                                sales.map(sale => (
                                    <tr key={sale.id}>
                                        <td>{sale.cliente}</td>
                                        <td>{new Date(sale.data_pedido).toLocaleDateString('pt-BR')}</td>
                                        <td>{formatPaymentMethod(sale.metodo_pagamento)}</td>
                                        <td>{sale.quantidade_parcelas}x</td>
                                        <td><StatusPill text={formatStatus(sale.status_pagamento)} type={getStatusPillType(sale.status_pagamento)} /></td>
                                        <td><StatusPill text={formatStatus(sale.status_entrega)} type={getStatusPillType(sale.status_entrega)} /></td>
                                        <td>{formatCurrency(sale.subtotal)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Nenhuma venda encontrada.</td></tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export default SalesListPage;