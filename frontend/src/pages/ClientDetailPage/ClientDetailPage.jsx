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

    // --- ESTADOS PARA A EDIÇÃO ---
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ nome_completo: '', telefone: '', endereco: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Função para buscar os detalhes do cliente e inicializar os dados de edição
    const fetchClientDetails = async () => {
        try {
            const response = await api.get(`/clientes/${clientId}/`);
            setClient(response.data);
            // Inicializa os dados de edição com os dados do cliente
            setEditData({
                nome_completo: response.data.nome_completo,
                telefone: response.data.telefone,
                endereco: response.data.endereco,
            });
            // Se houver pedidos, expande o primeiro por padrão
            if (response.data?.pedidos?.length > 0) {
              setExpandedOrderId(response.data.pedidos[0].id);
            }
        } catch (error) {
            console.error("Falha ao buscar detalhes do cliente:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchClientDetails();
    }, [clientId]); // Re-executa se o clientId na URL mudar

    // Função para lidar com a mudança nos inputs de edição
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditData(prevData => ({ ...prevData, [name]: value }));
    };

    // Função para salvar as alterações
    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const response = await api.put(`/clientes/${clientId}/`, editData);
            setClient(response.data); // Atualiza o estado principal com os novos dados
            setIsEditing(false); // Retorna para o modo de visualização
        } catch (error) {
            console.error("Erro ao salvar alterações:", error.response?.data);
            alert("Falha ao salvar. Verifique os dados.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Função para cancelar a edição
    const handleCancel = () => {
        // Restaura os dados de edição para os originais do cliente
        setEditData({
            nome_completo: client.nome_completo,
            telefone: client.telefone,
            endereco: client.endereco,
        });
        setIsEditing(false);
    };

    // Função para abrir/fechar os detalhes de um pedido
    const handleRowClick = (orderId) => {
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
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
                <h2 className="section-title">Informações do cliente:</h2>
                <div className="client-info-card">
                    {/* Renderização condicional para o nome */}
                    <div>
                        <strong>Cliente:</strong>
                        {isEditing ? (
                            <input 
                                type="text" 
                                name="nome_completo"
                                value={editData.nome_completo} 
                                onChange={handleInputChange} 
                                className="info-card-input"
                                disabled={isSubmitting}
                            />
                        ) : (
                            <span>{client.nome_completo}</span>
                        )}
                    </div>
                    {/* Renderização condicional para o telefone */}
                    <div>
                        <strong>N° Telefone:</strong>
                        {isEditing ? (
                            <input 
                                type="text" 
                                name="telefone"
                                value={editData.telefone} 
                                onChange={handleInputChange} 
                                className="info-card-input"
                                disabled={isSubmitting}
                            />
                        ) : (
                            <span>{client.telefone}</span>
                        )}
                    </div>
                    {/* Renderização condicional para o endereço */}
                    <div>
                        <strong>Endereço:</strong>
                        {isEditing ? (
                            <input 
                                type="text" 
                                name="endereco"
                                value={editData.endereco} 
                                onChange={handleInputChange} 
                                className="info-card-input"
                                disabled={isSubmitting}
                            />
                        ) : (
                            <span>{client.endereco}</span>
                        )}
                    </div>
                    {/* Total gasto não é editável */}
                    <div>
                        <strong>Total gasto:</strong>
                        <span>{Number(client.total_gasto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>

                    {/* Renderização condicional para os botões de ação */}
                    <div className="actions">
                        {isEditing ? (
                            <div className="edit-actions">
                                <button onClick={handleSave} className="action-btn save-btn" disabled={isSubmitting}>
                                    {isSubmitting ? '...' : <FaSave />}
                                </button>
                                <button onClick={handleCancel} className="action-btn cancel-btn" disabled={isSubmitting}>
                                    <FaTimes />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="edit-btn">
                                <FaPencilAlt />
                            </button>
                        )}
                    </div>
                </div>

                {/* Lista de Pedidos */}
                <div className="page-header">
                    <h2 className="section-title">Pedidos:</h2>
                    <Button icon={FaPlus} onClick={() => setIsOrderModalOpen(true)}>
                        Adicionar pedido
                    </Button>
                </div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data do pedido</th>
                                <th>Método de pagamento</th>
                                <th>Parcelamento</th>
                                <th>Status do pagamento</th>
                                <th>Status da entrega</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {client.pedidos.map(order => (
                                <React.Fragment key={order.id}>
                                    <tr onClick={() => handleRowClick(order.id)}>
                                        <td>{new Date(order.data_pedido).toLocaleDateString('pt-BR')}</td>
                                        <td>{order.metodo_pagamento}</td>
                                        <td>{order.quantidade_parcelas}x</td>
                                        <td><StatusPill text={order.status_pagamento} /></td>
                                        <td><StatusPill text={order.status_entrega} /></td>
                                        <td>{Number(order.subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    </tr>
                                    {expandedOrderId === order.id && order.itens.length > 0 && (
                                        <tr className="products-row">
                                            <td colSpan="6">
                                                <div className="products-table-container">
                                                    <h3 className="products-title">Produtos:</h3>
                                                    <table className="products-table">
                                                        <tbody>
                                                            {order.itens.map(item => (
                                                                <tr key={item.id}>
                                                                    <td>{item.quantidade}x</td>
                                                                    <td>{item.produto.nome}</td>
                                                                    <td>{item.produto.marca}</td>
                                                                    <td>{item.produto.categoria}</td>
                                                                    <td>{Number(item.produto.preco_dolar).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                                                    <td>{Number(item.preco_venda_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                    <td>Valor Vendido</td>
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
            <Modal 
                isOpen={isOrderModalOpen} 
                onClose={() => setIsOrderModalOpen(false)}
                title="Formulário para adicionar pedido"
            >
                <AddOrderForm 
                    onClose={() => setIsOrderModalOpen(false)} 
                    onOrderAdded={() => {
                        setIsOrderModalOpen(false);
                        fetchClientDetails(); // Atualiza a página inteira para mostrar o novo pedido
                    }}
                />
            </Modal>
        </>
    );
};

export default ClientDetailPage;