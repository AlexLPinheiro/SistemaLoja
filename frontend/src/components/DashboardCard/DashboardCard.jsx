// src/components/DashboardCard/DashboardCard.jsx
import React from 'react';
import './DashboardCard.css';

const DashboardCard = ({ title, subtitle, value }) => {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <p className="card-subtitle">{subtitle}</p>
      </div>
      <div className="card-value">
        {value}
      </div>
    </div>
  );
};

export default DashboardCard;