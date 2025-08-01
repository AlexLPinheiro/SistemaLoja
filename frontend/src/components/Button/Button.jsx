// src/components/Button/Button.jsx
import React from 'react';
import './Button.css';

// variant pode ser 'primary', 'secondary-outline', 'danger'
const Button = ({ children, onClick, variant = 'primary', type = 'button', icon: Icon }) => {
    return (
    <button onClick={onClick} type={type} className={`btn btn-${variant}`}>
      {Icon && <Icon className="btn-icon" />}
      {children}
    </button>
  );
};

export default Button;