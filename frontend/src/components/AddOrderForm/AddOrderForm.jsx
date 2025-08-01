import React, { useState, useEffect } from 'react';
import Button from '../Button/Button';
import api from '../../services/api';
import './AddOrderForm.css';

const AddOrderForm = ({ onClose, onOrderAdded, clientId }) => {
    // Estado para os dados principais do pedido
    const [metodoPagamento, setMetodoPagamento] = useState('a_vista');
    const [quantidadeParcelas, setQuantidadeParcelas] = useState(1);
    
    // Estado para os itens do pedido
    const [orderItems, setOrderItems] = useState([
        { id: 1, produto_id: '', quantidade: 1, preco_venda_unitario: '' }
    ]);
    
    // Estado para a lista de produtos disponíveis no sistema
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

    // Adiciona uma nova linha de produto em branco
    const handleAddRow = () => {
        setOrderItems([
            ...orderItems,
            { id: Date.now(), produto_id: '', quantidade: 1, preco_venda_unitario: '' }
        ]);
    };

    // Atualiza um campo de um item específico
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...orderItems];
        updatedItems[index][field] = value;

        // Se o produto foi alterado, atualiza os preços para referência
        if (field === 'produto_id') {
            const product = availableProducts.find(p => p.id.toString() === value);
            updatedItems[index].productDetails = product;
        }
        setOrderItems(updatedItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Monta o payload para a API
        const payload = {
            cliente_id: clientId,
            metodo_pagamento: metodoPagamento,
            quantidade_parcelas: metodoPagamento === 'parcelado' ? quantidadeParcelas : 1,
            // A lógica de status_pagamento será definida no backend ou aqui, se necessário.
            // Por simplicidade, vamos deixar o backend definir o padrão.
            status_pagamento: 'nao_pago', // Exemplo de status inicial
            itens: orderItems.map(item => ({
                produto_id: parseInt(item.produto_id, 10),
                quantidade: parseInt(item.quantidade, 10),
                preco_venda_unitario: parseFloat(item.preco_venda_unitario).toFixed(2)
            })).filter(item => item.produto_id) // Filtra linhas vazias
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
            alert("Falha ao criar o pedido.");
        }
    };

    return (
        <form className="add-order-form" onSubmit={handleSubmit}>
            {/* Seção de Pagamento */}
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
            </div>

            {/* Seção de Produtos */}
            <div className="products-section">
                {orderItems.map((item, index) => (
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
                        {/* Preços de referência (não editáveis) */}
                        <div className="price-ref">
                            <span>Custo U$: {item.productDetails ? Number(item.productDetails.preco_dolar).toFixed(2) : '0.00'}</span>
                            <span>Custo R$: {item.productDetails ? Number(item.productDetails.preco_real_custo).toFixed(2) : '0.00'}</span>
                        </div>
                        <input type="text" placeholder="Preço Venda (R$)" value={item.preco_venda_unitario} onChange={(e) => handleItemChange(index, 'preco_venda_unitario', e.target.value)} />
                    </div>
                ))}
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