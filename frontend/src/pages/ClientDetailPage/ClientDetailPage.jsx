import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaPencilAlt, FaPlus, FaSave, FaTimes } from 'react-icons/fa';

// Componentes e Serviços
import Button from '../../components/Button/Button';
import StatusPill from '../../components/StatusPill/StatusPill';
import Modal from '../../components/Modal/Modal';
import AddOrderForm from '../../components/AddOrderForm/AddOrderForm';
import api from '../../services/api';

// Estilos
import './ClientDetailPage.css';
import '../../styles/table.css';

const ClientDetailPage = () => {
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ nome_completo: '', telefone: '', endereco: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Função para buscar os detalhes do cliente
    const fetchClientDetails = async () => {
        try {
            const response = await api.get(`/clientes/${clientId}/`);
            const clientData = response.data;
            setClient(clientData);
            setEditData({
                nome_completo: clientData.nome_completo,
                telefone: clientData.telefone,
                endereco: clientData.endereco,
            });
        } catch (error) {
            console.error("Falha ao buscar detalhes do cliente:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchClientDetails();
    }, [clientId]);

    // Função para atualizar o status de um pedido
    const handleStatusUpdate = async (orderId, field, newValue) => {
        try {
            const response = await api.patch(`/pedidos/${orderId}/atualizar-status/`, {
                [field]: newValue
            });

            // Atualiza o estado local para refletir a mudança imediatamente
            const updatedClientData = { ...client };
            const orderIndex = updatedClientData.pedidos.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                updatedClientData.pedidos[orderIndex] = response.data;
                setClient(updatedClientData);
            }
        } catch (error) {
            console.error("Erro ao atualizar status:", error.response?.data);
            alert("Falha ao atualizar o status do pedido.");
        }
    };

    // Funções de edição do cliente
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const response = await api.put(`/clientes/${clientId}/`, editData);
            setClient(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error("Erro ao salvar alterações:", error.response?.data);
            alert("Falha ao salvar. Verifique os dados.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCancel = () => {
        setEditData({
            nome_completo: client.nome_completo,
            telefone: client.telefone,
            endereco: client.endereco,
        });
        setIsEditing(false);
    };

    const handleRowClick = (orderId, e) => {
        if (e.target.closest('button')) {
            return;
        }
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    // Funções para formatar os dados vindos da API
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

    // Função para determinar o estilo da pílula
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

    if (loading) {
        return <main className="main-content"><div>Carregando...</div></main>;
    }

    if (!client) {
        return <main className="main-content"><div>Cliente não encontrado.</div></main>;
    }

    return (
        <>
            <main className="main-content">
                {/* Seção de Informações do Cliente */}
                <h2 className="section-title">Informações do cliente:</h2>
                <div className="client-info-card">
                    <div><strong>Cliente:</strong>{isEditing ? <input type="text" name="nome_completo" value={editData.nome_completo} onChange={handleInputChange} className="info-card-input" disabled={isSubmitting}/> : <span>{client.nome_completo}</span>}</div>
                    <div><strong>N° Telefone:</strong>{isEditing ? <input type="text" name="telefone" value={editData.telefone} onChange={handleInputChange} className="info-card-input" disabled={isSubmitting}/> : <span>{client.telefone}</span>}</div>
                    <div><strong>Endereço:</strong>{isEditing ? <input type="text" name="endereco" value={editData.endereco} onChange={handleInputChange} className="info-card-input" disabled={isSubmitting}/> : <span>{client.endereco}</span>}</div>
                    <div><strong>Total gasto:</strong><span>{Number(client.total_gasto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                    <div className="actions">{isEditing ? (<div className="edit-actions"><button onClick={handleSave} className="action-btn save-btn" disabled={isSubmitting}>{isSubmitting ? '...' : <FaSave />}</button><button onClick={handleCancel} className="action-btn cancel-btn" disabled={isSubmitting}><FaTimes /></button></div>) : (<button onClick={() => setIsEditing(true)} className="edit-btn"><FaPencilAlt /></button>)}</div>
                </div>

                {/* Seção de Pedidos */}
                <div className="page-header"><h2 className="section-title">Pedidos:</h2><Button icon={FaPlus} onClick={() => setIsOrderModalOpen(true)}>Adicionar pedido</Button></div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data do pedido</th><th>Método de Pagamento</th><th>Parcelamento</th><th>Status do Pagamento</th><th>Status da Entrega</th><th>Subtotal</th><th>Lucro Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {client.pedidos.map(order => (
                                <React.Fragment key={order.id}>
                                    <tr onClick={(e) => handleRowClick(order.id, e)}>
                                        <td>{new Date(order.data_pedido).toLocaleDateString('pt-BR')}</td>
                                        <td>{formatPaymentMethod(order.metodo_pagamento)}</td>
                                        <td>{order.quantidade_parcelas}x</td>
                                        <td><StatusPill text={formatStatus(order.status_pagamento)} type={getStatusPillType(order.status_pagamento)} onClick={() => handleStatusUpdate(order.id, 'status_pagamento', order.status_pagamento === 'pago' ? 'nao_pago' : 'pago')}/></td>
                                        <td><StatusPill text={formatStatus(order.status_entrega)} type={getStatusPillType(order.status_entrega)} onClick={() => handleStatusUpdate(order.id, 'status_entrega', order.status_entrega === 'entregue' ? 'nao_entregue' : 'entregue')}/></td>
                                        <td>{Number(order.subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td>{Number(order.lucro_final).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    </tr>
                                    {expandedOrderId === order.id && order.itens.length > 0 && (
                                        <tr className="products-row">
                                            <td colSpan="7">
                                                <div className="products-table-container">
                                                    <h3 className="products-title">Produtos:</h3>
                                                    <table className="products-table">
                                                        <thead><tr><th>Qtd</th><th>Nome</th><th>Marca</th><th>Categoria</th><th>Preço Custo (R$)</th><th>Preço Venda (R$)</th><th>Lucro (R$)</th></tr></thead>
                                                        <tbody>
                                                            {order.itens.map(item => (
                                                                <tr key={item.id}>
                                                                    <td>{item.quantidade}x</td><td>{item.produto.nome}</td><td>{item.produto.marca}</td><td>{item.produto.categoria}</td>
                                                                    <td>{Number(item.produto.preco_real_custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                    <td>{Number(item.preco_venda_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                    <td>{Number(item.lucro_item).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Modal de Adicionar Pedido */}
            <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Formulário para adicionar pedido">
                <AddOrderForm 
                    onClose={() => setIsOrderModalOpen(false)} 
                    onOrderAdded={() => {
                        setIsOrderModalOpen(false);
                        fetchClientDetails();
                    }}
                    clientId={clientId}
                />
            </Modal>
        </>
    );
};

export default ClientDetailPage;