// frontend/src/pages/HomePage/HomePage.jsx
import React, { useState, useEffect } from 'react'; // Importe useState e useEffect
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import api from '../../services/api'; // Importe nosso cliente de API
import './HomePage.css';

// Uma função helper para formatar os números como moeda
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const HomePage = () => {
  // Estado para armazenar os dados do dashboard
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect para buscar os dados quando o componente montar
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
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  if (loading) {
    return <main className="home-page-content"><div>Carregando...</div></main>;
  }

  if (error) {
    return <main className="home-page-content"><div>{error}</div></main>;
  }

  return (
    <main className="home-page-content">
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
          subtitle="Cotação do dia 27/07/2025"
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