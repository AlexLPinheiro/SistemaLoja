import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';

// Componentes
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import AddProductForm from '../../components/AddProductForm/AddProductForm';
import AddCategoryForm from '../../components/AddCategoryForm/AddCategoryForm';

// Serviços e Estilos
import api from '../../services/api';
import './ProductsListPage.css';
import '../../styles/table.css';

// Função helper para formatar moeda
const formatCurrency = (value) => {
    if (isNaN(value)) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ProductsListPage = () => {
    // Estados da página
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    
    // Estado para o termo de busca
    const [searchQuery, setSearchQuery] = useState('');

    // Função para buscar as categorias da API (só precisa ser chamada uma vez)
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

    // useEffect para buscar as categorias apenas uma vez quando o componente montar
    useEffect(() => {
        fetchCategories();
    }, []);

    // useEffect para buscar os produtos toda vez que o termo de busca (searchQuery) mudar
    useEffect(() => {
        // Função para buscar os produtos, agora dentro do useEffect para capturar a 'query'
        const fetchProducts = async (query) => {
            try {
                setLoadingProducts(true);
                const response = await api.get('/produtos/', {
                    params: { search: query }
                });
                setProducts(response.data);
            } catch (error) {
                console.error("Falha ao buscar produtos:", error);
            } finally {
                setLoadingProducts(false);
            }
        };

        // Cria um temporizador para aguardar o usuário parar de digitar
        const timerId = setTimeout(() => {
            fetchProducts(searchQuery);
        }, 500); // Espera 500ms após a última digitação

        // Função de limpeza: cancela o temporizador anterior se o usuário digitar novamente
        return () => clearTimeout(timerId);
    }, [searchQuery]); // O array de dependência garante que este efeito rode sempre que 'searchQuery' mudar

    // Callback para quando um produto é adicionado
    const handleProductAdded = () => {
        setIsProductModalOpen(false);
        setSearchQuery(''); // Limpa a busca para mostrar o produto novo no topo (opcional)
        // A busca será refeita automaticamente pelo useEffect da searchQuery
    };
    
    // Callback para quando uma categoria é adicionada
    const handleCategoryAdded = () => {
        setIsCategoryModalOpen(false);
        fetchCategories(); // Atualiza a lista de categorias
    };
  
    return (
        <>
            <main className="main-content">
                <div className="page-header">
                    <div className="header-actions">
                        <Button onClick={() => setIsProductModalOpen(true)}>Adicionar produto</Button>
                        <Button onClick={() => setIsCategoryModalOpen(true)} variant="success">Adicionar categoria</Button>
                    </div>
                    <div className="search-bar">
                        <FaSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Pesquise por nome, categoria ou marca"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
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
                                <th>Preço em reais</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingProducts ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Carregando...</td></tr>
                            ) : (
                                products.length > 0 ? (
                                    products.map(product => (
                                        <tr key={product.id}>
                                            <td>{product.nome}</td>
                                            <td>{product.marca}</td>
                                            <td>{product.categoria}</td>
                                            <td>{Number(product.preco_dolar).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                            <td>{formatCurrency(product.preco_real_custo)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Nenhum produto encontrado.</td></tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Modal para Adicionar Produto */}
            <Modal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                title="Formulário para adicionar produto:"
            >
                <AddProductForm 
                    onClose={() => setIsProductModalOpen(false)} 
                    onProductAdded={handleProductAdded}
                    categories={categories}
                    loadingCategories={loadingCategories}
                />
            </Modal>

            {/* Modal para Adicionar Categoria */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title="Formulário para adicionar categoria:"
            >
                <AddCategoryForm 
                    onClose={() => setIsCategoryModalOpen(false)}
                    onCategoryAdded={handleCategoryAdded}
                />
            </Modal>
        </>
    );
};

export default ProductsListPage;