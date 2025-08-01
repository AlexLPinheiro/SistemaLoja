// src/components/Modal/Modal.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // O overlay que cobre a tela inteira. Clicar nele fecha o modal.
    <div className="modal-overlay" onClick={onClose}>
      {/* O conteúdo do modal. Clicar dentro dele NÃO fecha. */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="modal-close-btn">
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;