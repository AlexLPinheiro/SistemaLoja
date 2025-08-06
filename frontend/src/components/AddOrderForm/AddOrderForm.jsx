import React, { useState, useEffect } from 'react';
import Button from '../Button/Button';
import api from '../../services/api';
import './AddOrderForm.css';

const AddOrderForm = ({ onClose, onOrderAdded, clientId }) => {
    // Estado para os dados principais do pedido
    const [metodoPagamento, setMetodoPagamento] = useState('a_vista');
    const [quantidadeParcelas, setQuantidadeParcelas] = useState(2);
    const [valorServico, setValorServico] = useState('');

    // Estado para os itens do pedido
    const [orderItems, setOrderItems] = useState([
        { id: Date.now(), produto_id: '', quantidade: 1, margem_venda_unitaria: '', productDetails: null }
    ]);
    
    // Estado para a lista de produtos disponíveis
    const [availableProducts, setAvailableProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Busca todos os produtos disponíveis quando o modal abre
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/produtos/');
                setAvailableProducts(response.data);
            } catch (error) {
                console.error("Erro ao buscar produtos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Adiciona uma nova linha de produto
    const handleAddRow = () => {
        setOrderItems([
            ...orderItems,
            { id: Date.now(), produto_id: '', quantidade: 1, margem_venda_unitaria: '', productDetails: null }
        ]);
    };

    // Atualiza um campo de um item específico
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...orderItems];
        updatedItems[index][field] = value;

        if (field === 'produto_id') {
            const product = availableProducts.find(p => p.id.toString() === value);
            updatedItems[index].productDetails = product || null;
        }
        setOrderItems(updatedItems);
    };

    // Lida com o envio do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            cliente_id: clientId,
            metodo_pagamento: metodoPagamento,
            quantidade_parcelas: metodoPagamento === 'parcelado' ? parseInt(quantidadeParcelas, 10) : 1,
            status_pagamento: 'nao_pago',
            valor_servico: parseFloat(valorServico) || 0.00,
            itens: orderItems
                .map(item => ({
                    produto_id: parseInt(item.produto_id, 10),
                    quantidade: parseInt(item.quantidade, 10),
                    margem_venda_unitaria: parseFloat(item.margem_venda_unitaria) || 0.00
                }))
                .filter(item => item.produto_id && !isNaN(item.produto_id))
        };
        
        if (payload.itens.length === 0) {
            alert("Adicione pelo menos um produto ao pedido.");
            return;
        }

        try {
            await api.post('/pedidos/', payload);
            alert("Pedido adicionado com sucesso!");
            if (onOrderAdded) {
                onOrderAdded();
            }
        } catch (error) {
            console.error("Erro ao criar pedido:", error.response?.data);
            alert("Falha ao criar o pedido. Verifique o console para mais detalhes.");
        }
    };

    return (
        <form className="add-order-form" onSubmit={handleSubmit}>
            <div className="form-grid-top">
                <div className="form-group">
                    <label>Tipo de pagamento:</label>
                    <select value={metodoPagamento} onChange={(e) => setMetodoPagamento(e.target.value)}>
                        <option value="a_vista">À vista</option>
                        <option value="parcelado">Parcelado</option>
                    </select>
                </div>
                {metodoPagamento === 'parcelado' && (
                    <div className="form-group">
                        <label>Qtd de parcelas</label>
                        <input 
                            type="number" 
                            min="2" 
                            value={quantidadeParcelas} 
                            onChange={(e) => setQuantidadeParcelas(e.target.value)} 
                        />
                    </div>
                )}
                <div className="form-group">
                    <label>Valor do Serviço (R$)</label>
                    <input 
                        type="text" 
                        placeholder="0.00"
                        value={valorServico}
                        onChange={(e) => setValorServico(e.target.value)}
                    />
                </div>
            </div>

            <div className="products-section">
                {orderItems.map((item, index) => {
                    const totalCostBRL = item.productDetails 
                        ? (Number(item.productDetails.preco_real_custo) * (Number(item.quantidade) || 0)).toFixed(2)
                        : '0.00';

                    return (
                        <div key={item.id} className="product-input-row">
                            <select 
                                value={item.produto_id} 
                                onChange={(e) => handleItemChange(index, 'produto_id', e.target.value)}
                                className="product-select"
                            >
                                <option value="">{loading ? "Carregando..." : "Selecione um produto"}</option>
                                {availableProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                            <input type="number" min="1" placeholder="Qtd" value={item.quantidade} onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)} />
                            <div className="price-ref">
                                <span>Custo Total R$: {totalCostBRL}</span>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Valor Adicionado (R$)" 
                                value={item.margem_venda_unitaria} 
                                onChange={(e) => handleItemChange(index, 'margem_venda_unitaria', e.target.value)} 
                            />
                        </div>
                    );
                })}
            </div>
            
            <button type="button" className="add-product-btn" onClick={handleAddRow}>
                Adicionar produto+
            </button>

            <div className="form-actions">
                <Button type="submit" variant="danger">Salvar Pedido</Button>
                <Button type="button" variant="secondary-outline" onClick={onClose}>Cancelar</Button>
            </div>
        </form>
    );
};

export default AddOrderForm;