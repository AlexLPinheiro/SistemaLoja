import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch } from 'react-icons/fa';

// Componentes e Serviços
import Button from '../../components/Button/Button';
import api from '../../services/api';

// Estilos
import './ClientsListPage.css';
import '../../styles/table.css';

// Função helper para formatar moeda
const formatCurrency = (value) => {
    if (isNaN(value)) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ClientsListPage = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // useEffect para buscar os clientes com base na pesquisa (com debounce)
    useEffect(() => {
        const fetchClients = async (query) => {
            try {
                setLoading(true);
                const response = await api.get('/clientes/', {
                    params: { search: query }
                });
                setClients(response.data);
            } catch (error) {
                console.error("Falha ao buscar clientes:", error);
            } finally {
                setLoading(false);
            }
        };

        const timerId = setTimeout(() => {
            fetchClients(searchQuery);
        }, 500); // Aguarda 500ms após o usuário parar de digitar

        return () => clearTimeout(timerId); // Limpa o timer anterior a cada nova digitação
    }, [searchQuery]); // Roda sempre que a searchQuery mudar

    return (
        <main className="main-content">
            <div className="page-header">
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Pesquise por nome, telefone ou endereço"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => navigate('/clientes/novo')} icon={FaPlus}>
                    Adicionar cliente
                </Button>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Clientes</th>
                            <th>N° Telefone</th>
                            <th>Endereço</th>
                            <th>Total gasto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Carregando...</td></tr>
                        ) : (
                            clients.length > 0 ? (
                                clients.map(client => (
                                    <tr key={client.id} onClick={() => navigate(`/clientes/${client.id}`)}>
                                        <td>{client.nome_completo}</td>
                                        <td>{client.telefone}</td>
                                        <td>{client.endereco}</td>
                                        <td>{formatCurrency(client.total_gasto)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Nenhum cliente encontrado.</td></tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export default ClientsListPage;