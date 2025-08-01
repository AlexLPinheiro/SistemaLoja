// src/components/StatusPill/StatusPill.jsx
import React from 'react';
import './StatusPill.css';

// type pode ser 'success', 'warning', 'info', 'default'
const StatusPill = ({ text, type = 'default' }) => {
  return (
    <span className={`status-pill pill-${type}`}>
      {text}
    </span>
  );
};

export default StatusPill;