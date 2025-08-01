import React, { useState, useEffect } from 'react';
import Button from '../Button/Button';
import api from '../../services/api';
import './AddProductForm.css';

const AddProductForm = ({ onClose, onProductAdded, categories, loadingCategories }) => {
    // Estados para os campos do formulário
    const [nome, setNome] = useState('');
    const [marca, setMarca] = useState('');
    const [precoDolar, setPrecoDolar] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // Este useEffect agora reage às props que vêm do componente pai.
    useEffect(() => {
        // Quando as categorias terminam de carregar, seleciona a primeira como padrão.
        if (!loadingCategories && categories.length > 0) {
            // Se a categoria atualmente selecionada não existir mais na lista ou estiver vazia,
            // define a primeira da lista como a nova seleção.
            const currentCategoryExists = categories.some(c => c.id.toString() === selectedCategory.toString());
            if (!selectedCategory || !currentCategoryExists) {
                setSelectedCategory(categories[0].id);
            }
        }
    }, [categories, loadingCategories, selectedCategory]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedCategory) {
            alert("Por favor, selecione uma categoria.");
            return;
        }

        const newProductData = {
            nome: nome,
            marca: marca,
            preco_dolar: precoDolar,
            categoria_id: selectedCategory,
        };

        try {
            await api.post('/produtos/', newProductData);
            console.log("Produto salvo com sucesso!");
            if (onProductAdded) {
                onProductAdded();
            }
        } catch (error) {
            console.error("Erro ao salvar produto:", error.response?.data || error.message);
        }
    };

    return (
        <form className="add-product-form" onSubmit={handleSave}>
            <div className="form-grid">
                <div className="form-group full-width">
                    <label htmlFor="productName">Nome do produto</label>
                    <input 
                        type="text" id="productName" placeholder="Ex: Tênis Nike Revolution 7" 
                        value={nome} onChange={(e) => setNome(e.target.value)} 
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="category">Categoria</label>
                    <select 
                        id="category" 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        disabled={loadingCategories}
                    >
                        {loadingCategories ? (
                            <option>Carregando...</option>
                        ) : (
                            categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.nome}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="brand">Marca</label>
                    <input 
                        type="text" id="brand" placeholder="Ex: Nike" 
                        value={marca} onChange={(e) => setMarca(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="priceUSD">Preço do produto U$</label>
                    <input 
                        type="text" id="priceUSD" placeholder="15.00" 
                        value={precoDolar} onChange={(e) => setPrecoDolar(e.target.value)}
                    />
                </div>
            </div>
            <div className="form-actions">
                <Button type="submit" variant="danger">Salvar</Button>
                <Button type="button" variant="secondary-outline" onClick={onClose}>Cancelar</Button>
            </div>
        </form>
    );
};

export default AddProductForm;