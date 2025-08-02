// frontend/src/pages/HomePage/HomePage.jsx
import React, { useState, useEffect } from 'react';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import api from '../../services/api';
import './HomePage.css';

const formatCurrency = (value) => {
  if (typeof value !== 'number' && typeof value !== 'string') return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const HomePage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- OBTENDO E FORMATANDO A DATA ATUAL ---
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR'); // Formata para "dd/mm/aaaa"

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/');
        setDashboardData(response.data);
      } catch (err) {
        setError('Falha ao carregar os dados do dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <main className="main-content"><div>Carregando...</div></main>;
  }

  if (error) {
    return <main className="main-content"><div>{error}</div></main>;
  }

  return (
    <main className="main-content">
      <div className="info-pill">
        <strong>Dados da viagem:</strong> Dados da viagem de 03/08/2025
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Lucro do período:"
          subtitle="Dados do período selecionado"
          value={formatCurrency(dashboardData.lucro_do_periodo)}
        />
        <DashboardCard
          title="Gastos do período:"
          subtitle="Dados do período selecionado"
          value={formatCurrency(dashboardData.gastos_do_periodo)}
        />
        <DashboardCard
          title="Cotação do dólar do dia:"
          // --- USANDO A DATA DINÂMICA ---
          subtitle={`Cotação do dia ${formattedDate}`}
          value={formatCurrency(dashboardData.cotacao_dolar_dia)}
        />
        <DashboardCard
          title="Quantidade de pedidos em aberto:"
          subtitle="Quantidade de pedidos que ainda não foram pagos ou que ainda não foram entregues"
          value={dashboardData.pedidos_em_aberto}
        />
      </div>
    </main>
  );
};

export default HomePage;