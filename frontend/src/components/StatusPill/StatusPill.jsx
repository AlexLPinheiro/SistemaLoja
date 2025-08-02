// frontend/src/components/StatusPill/StatusPill.jsx
import React from 'react';
import './StatusPill.css';

// type pode ser 'success', 'warning', 'info', 'default'
// isClickable adiciona um estilo de hover para indicar que é um botão
const StatusPill = ({ text, type = 'default', onClick }) => {
  const isClickable = !!onClick; // Verdadeiro se a prop onClick for fornecida

  return (
    <button 
      className={`status-pill pill-${type} ${isClickable ? 'clickable' : ''}`}
      onClick={onClick}
      disabled={!isClickable} // Desabilita o botão se não houver função de clique
    >
      {text}
    </button>
  );
};

export default StatusPill;