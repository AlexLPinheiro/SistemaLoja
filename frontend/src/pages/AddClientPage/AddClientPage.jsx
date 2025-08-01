import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

// Componentes e Serviços
import Button from '../../components/Button/Button';
import api from '../../services/api';

// Estilos
import './AddClientPage.css';

const AddClientPage = () => {
    const navigate = useNavigate();

    // Estados para cada campo do formulário
    const [primeiroNome, setPrimeiroNome] = useState('');
    const [segundoNome, setSegundoNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');

    // Estados para controle de feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Impede o recarregamento da página
        setIsSubmitting(true);
        setError(null);

        // Combina o primeiro e segundo nome para corresponder ao modelo do backend
        const nomeCompleto = `${primeiroNome} ${segundoNome}`.trim();

        // Validação simples
        if (!nomeCompleto || !telefone || !endereco) {
            setError("Todos os campos são obrigatórios.");
            setIsSubmitting(false);
            return;
        }

        const clientData = {
            nome_completo: nomeCompleto,
            telefone: telefone,
            endereco: endereco,
        };

        try {
            await api.post('/clientes/', clientData);
            console.log("Cliente adicionado com sucesso!");
            // Redireciona para a lista de clientes após o sucesso
            navigate('/clientes');
        } catch (err) {
            console.error("Erro ao adicionar cliente:", err.response?.data || err.message);
            setError("Falha ao adicionar o cliente. Verifique os dados e tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="main-content">
            <div className="add-client-page">
                <div className="breadcrumb">
                    <button onClick={() => navigate('/clientes')} className="back-button">
                        <FaArrowLeft />
                    </button>
                    <span className="breadcrumb-text">CLIENTES / NOVO CLIENTE</span>
                </div>

                <form className="client-form" onSubmit={handleSubmit}>
                    <h2 className="form-title">Formulário para adicionar novo cliente</h2>
                    
                    {error && <p className="form-error-message">{error}</p>}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">Primeiro nome:</label>
                            <input 
                                type="text" 
                                id="firstName"
                                value={primeiroNome}
                                onChange={(e) => setPrimeiroNome(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Segundo nome:</label>
                            <input 
                                type="text" 
                                id="lastName" 
                                value={segundoNome}
                                onChange={(e) => setSegundoNome(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Telefone:</label>
                        <input 
                            type="text" 
                            id="phone" 
                            placeholder="+55 (19) 98888-7777"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="address">Endereço:</label>
                        <input 
                            type="text" 
                            id="address"
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-actions">
                        <Button type="submit" variant="danger" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button type="button" variant="secondary-outline" onClick={() => navigate('/clientes')}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default AddClientPage;