import React, { useState, useEffect } from 'react';
import Button from '../Button/Button';
import api from '../../services/api';
// Reutilizaremos o CSS do formulário de adição para manter a consistência
import '../AddProductForm/AddProductForm.css'; 

const EditProductForm = ({ productToEdit, onClose, onProductUpdated, categories, loadingCategories }) => {
    const [nome, setNome] = useState('');
    const [marca, setMarca] = useState('');
    const [precoDolar, setPrecoDolar] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Efeito para popular o formulário quando um produto é selecionado para edição
    useEffect(() => {
        if (productToEdit && categories.length > 0) {
            setNome(productToEdit.nome);
            setMarca(productToEdit.marca);
            setPrecoDolar(productToEdit.preco_dolar);
            
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
                <div className="form-group full-width"><label htmlFor="productName">Nome do produto</label><input type="text" id="productName" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
                <div className="form-group">
                    <label htmlFor="category">Categoria</label>
                    <select id="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} disabled={loadingCategories}>
                        {loadingCategories ? <option>Carregando...</option> : categories.map(category => (<option key={category.id} value={category.id}>{category.nome}</option>))}
                    </select>
                </div>
                <div className="form-group"><label htmlFor="brand">Marca</label><input type="text" id="brand" value={marca} onChange={(e) => setMarca(e.target.value)} /></div>
                <div className="form-group"><label htmlFor="priceUSD">Preço do produto U$</label><input type="text" id="priceUSD" value={precoDolar} onChange={(e) => setPrecoDolar(e.target.value)} /></div>
            </div>
            <div className="form-actions">
                <Button type="submit" variant="danger" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</Button>
                <Button type="button" variant="secondary-outline" onClick={onClose}>Cancelar</Button>
            </div>
        </form>
    );
};

export default EditProductForm;