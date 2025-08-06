import React, { useState, useEffect } from 'react';
import { FaSearch, FaPencilAlt, FaTrash } from 'react-icons/fa';

// Componentes
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import AddProductForm from '../../components/AddProductForm/AddProductForm';
import EditProductForm from '../../components/EditProductForm/EditProductForm';
import AddCategoryForm from '../../components/AddCategoryForm/AddCategoryForm';

// Serviços e Estilos
import api from '../../services/api';
import './ProductsListPage.css';
import '../../styles/table.css';

const formatCurrency = (value) => {
    if (isNaN(value)) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ProductsListPage = () => {
    // Estados para os dados
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Estados para controlar os modais
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Função para buscar produtos da API (com filtro de busca)
    const fetchProducts = async (query = '') => {
        try {
            setLoadingProducts(true);
            const response = await api.get('/produtos/', { params: { search: query } });
            setProducts(response.data);
        } catch (error) {
            console.error("Falha ao buscar produtos:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Função para buscar categorias da API
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await api.get('/categorias/');
            setCategories(response.data);
        } catch (error) {
            console.error("Falha ao buscar categorias:", error);
        } finally {
            setLoadingCategories(false);
        }
    };
    
    // Efeitos para carregar dados
    useEffect(() => { 
        fetchCategories(); 
    }, []);

    useEffect(() => {
        const timerId = setTimeout(() => {
            fetchProducts(searchQuery);
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchQuery]);

    // Função para apagar um produto
    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Tem certeza que deseja apagar este produto?')) {
            try {
                await api.delete(`/produtos/${productId}/`);
                setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
                alert('Produto apagado com sucesso!');
            } catch (error) {
                console.error('Erro ao apagar produto:', error.response?.data);
                alert('Falha ao apagar o produto.');
            }
        }
    };

    // Funções para o fluxo de edição
    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setIsEditModalOpen(true);
    };

    const handleProductUpdated = () => {
        setIsEditModalOpen(false);
        setEditingProduct(null);
        fetchProducts(searchQuery); // Atualiza a lista para refletir as mudanças
    };

    // Funções de callback para os modais de adição
    const handleProductAdded = () => {
        setIsAddModalOpen(false);
        setSearchQuery(''); // Limpa a busca para garantir que o novo produto apareça
        fetchProducts(''); // Busca todos os produtos novamente
    };
    
    const handleCategoryAdded = () => {
        setIsCategoryModalOpen(false);
        fetchCategories(); // Atualiza a lista de categorias
    };

    return (
        <>
            <main className="main-content">
                <div className="page-header">
                    <div className="header-actions">
                        <Button onClick={() => setIsAddModalOpen(true)}>Adicionar produto</Button>
                        <Button onClick={() => setIsCategoryModalOpen(true)} variant="success">Adicionar categoria</Button>
                    </div>
                    <div className="search-bar">
                        <FaSearch className="search-icon" />
                        <input type="text" placeholder="Pesquise por nome, categoria ou marca" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Marca</th>
                                <th>Categoria</th>
                                <th>Preço em Dolar</th>
                                <th>Preço em reais (Custo)</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingProducts ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Carregando...</td></tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id}>
                                        <td>{product.nome}</td>
                                        <td>{product.marca}</td>
                                        <td>{product.categoria}</td>
                                        <td>{Number(product.preco_dolar).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                        <td>{formatCurrency(0)} {/* O custo em reais não está disponível no ProdutoSerializer, isso pode ser ajustado se necessário */}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="action-btn edit-btn" onClick={() => handleOpenEditModal(product)}><FaPencilAlt /></button>
                                                <button className="action-btn delete-btn" onClick={() => handleDeleteProduct(product.id)}><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Formulário para adicionar produto:">
                <AddProductForm onClose={() => setIsAddModalOpen(false)} onProductAdded={handleProductAdded} categories={categories} loadingCategories={loadingCategories}/>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Formulário para editar produto:">
                <EditProductForm 
                    onClose={() => setIsEditModalOpen(false)} 
                    onProductUpdated={handleProductUpdated} 
                    productToEdit={editingProduct} 
                    categories={categories} 
                    loadingCategories={loadingCategories}
                />
            </Modal>

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Formulário para adicionar categoria:">
                <AddCategoryForm onClose={() => setIsCategoryModalOpen(false)} onCategoryAdded={handleCategoryAdded}/>
            </Modal>
        </>
    );
};

export default ProductsListPage;