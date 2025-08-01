// src/pages/SalesListPage/SalesListPage.jsx
import React from 'react';
import { FaSearch } from 'react-icons/fa';
import StatusPill from '../../components/StatusPill/StatusPill';
import './SalesListPage.css';
import '../../styles/table.css';

// Mock Data para a lista de vendas
const sales = [
  { id: 1, client: 'Alex Luna Pinheiro', paymentMethod: 'pagamento por pix', installments: 'À vista', paymentStatus: 'Em atraso', deliveryStatus: 'Entregue', subtotal: 'R$1250,00' },
  { id: 2, client: 'Alex Luna Pinheiro', paymentMethod: 'Parcelado', installments: '12X de R$25,00', paymentStatus: 'Pago', deliveryStatus: 'Não entregue', subtotal: 'R$1250,00' },
  { id: 3, client: 'Elaine Bretas', paymentMethod: 'Parcelado', installments: '12X de R$25,00', paymentStatus: 'Pago', deliveryStatus: 'Não entregue', subtotal: 'R$750,00' },
  { id: 4, client: 'Filipe Mussato', paymentMethod: 'Parcelado', installments: '12X de R$25,00', paymentStatus: 'Pago', deliveryStatus: 'Não entregue', subtotal: 'R$300,00' },
  { id: 5, client: 'Alex Luna Pinheiro', paymentMethod: 'Parcelado', installments: '12X de R$25,00', paymentStatus: 'Pago', deliveryStatus: 'Não entregue', subtotal: 'R$1250,00' },
  { id: 6, client: 'Alex Luna Pinheiro', paymentMethod: 'Parcelado', installments: '12X de R$25,00', paymentStatus: 'Pago', deliveryStatus: 'Não entregue', subtotal: 'R$1250,00' },
  { id: 7, client: 'Alex Luna Pinheiro', paymentMethod: 'Parcelado', installments: '12X de R$25,00', paymentStatus: 'Pago', deliveryStatus: 'Não entregue', subtotal: 'R$1250,00' },
  { id: 8, client: 'Alex Luna Pinheiro', paymentMethod: 'Parcelado', installments: '12X de R$25,00', paymentStatus: 'Pago', deliveryStatus: 'Não entregue', subtotal: 'R$1250,00' },
];

const getPillType = (status) => {
  switch (status) {
    case 'Pago':
    case 'Entregue':
      return 'success';
    case 'Em atraso':
      return 'info';
    case 'Não entregue':
    default:
      return 'default';
  }
}

const SalesListPage = () => {
  return (
    <main className="sales-list-page">
      <div className="page-header">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Pesquise por clientes" />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Método de pagamento</th>
              <th>Parcelamento</th>
              <th>Status do pagamento:</th>
              <th>Status da entrega</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.client}</td>
                <td>{sale.paymentMethod}</td>
                <td>{sale.installments}</td>
                <td><StatusPill text={sale.paymentStatus} type={getPillType(sale.paymentStatus)} /></td>
                <td><StatusPill text={sale.deliveryStatus} type={getPillType(sale.deliveryStatus)} /></td>
                <td>{sale.subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default SalesListPage;