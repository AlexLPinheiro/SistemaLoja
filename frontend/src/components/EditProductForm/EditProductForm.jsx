import React, { useState, useEffect } from 'react';
import Button from '../Button/Button';
import api from '../../services/api';
// Reutiliza o CSS do formulário de adição para manter a consistência
import '../AddProductForm/AddProductForm.css'; 

const EditProductForm = ({ productToEdit, onClose, onProductUpdated, categories, loadingCategories }) => {
    // Estados para os campos do formulário
    const [nome, setNome] = useState('');
    const [marca, setMarca] = useState('');
    const [precoDolar, setPrecoDolar] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [adicionarEstoque, setAdicionarEstoque] = useState(0); // Estado para a quantidade a ser adicionada
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Efeito para popular o formulário quando um produto é selecionado para edição
    useEffect(() => {
        if (productToEdit && categories.length > 0) {
            setNome(productToEdit.nome);
            setMarca(productToEdit.marca);
            setPrecoDolar(productToEdit.preco_dolar);
            setAdicionarEstoque(0); // Reseta o campo sempre que abrir o modal
            
            // Encontra o ID da categoria com base no nome
            const currentCategory = categories.find(c => c.nome === productToEdit.categoria);
            if (currentCategory) {
                setSelectedCategory(currentCategory.id);
            }
        }
    }, [productToEdit, categories]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const updatedProductData = {
            nome,
            marca,
            preco_dolar: precoDolar,
            categoria_id: selectedCategory,
            // Envia apenas a quantidade a ser adicionada
            adicionar_estoque: parseInt(adicionarEstoque, 10) || 0
        };

        try {
            await api.put(`/produtos/${productToEdit.id}/`, updatedProductData);
            alert("Produto atualizado com sucesso!");
            if (onProductUpdated) {
                onProductUpdated(); // Avisa a página pai para atualizar a lista
            }
        } catch (error) {
            console.error("Erro ao atualizar produto:", error.response?.data);
            alert("Falha ao atualizar o produto.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="add-product-form" onSubmit={handleSave}>
            <div className="form-grid">
                <div className="form-group full-width">
                    <label htmlFor="editProductName">Nome do produto</label>
                    <input type="text" id="editProductName" value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="editCategory">Categoria</label>
                    <select id="editCategory" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} disabled={loadingCategories}>
                        {loadingCategories ? <option>Carregando...</option> : categories.map(category => (<option key={category.id} value={category.id}>{category.nome}</option>))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="editBrand">Marca</label>
                    <input type="text" id="editBrand" value={marca} onChange={(e) => setMarca(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="editPriceUSD">Preço do produto U$</label>
                    <input type="text" id="editPriceUSD" value={precoDolar} onChange={(e) => setPrecoDolar(e.target.value)} />
                </div>

                {/* Campos de Estoque */}
                <div className="form-group">
                    <label htmlFor="currentStock">Estoque Atual</label>
                    <input type="text" id="currentStock" value={productToEdit?.quantidade_estoque ?? 0} disabled className="disabled-input" />
                </div>
                <div className="form-group">
                    <label htmlFor="addStock">Adicionar ao Estoque</label>
                    <input 
                        type="number" 
                        id="addStock"
                        min="0"
                        value={adicionarEstoque}
                        onChange={(e) => setAdicionarEstoque(e.target.value)}
                    />
                </div>
            </div>
            <div className="form-actions">
                <Button type="submit" variant="danger" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</Button>
                <Button type="button" variant="secondary-outline" onClick={onClose}>Cancelar</Button>
            </div>
        </form>
    );
};

export default EditProductForm;