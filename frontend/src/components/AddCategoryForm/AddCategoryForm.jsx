// frontend/src/components/AddCategoryForm/AddCategoryForm.jsx
import React, { useState } from 'react';
import Button from '../Button/Button';
import api from '../../services/api';
import './AddCategoryForm.css';

const AddCategoryForm = ({ onClose, onCategoryAdded }) => {
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('O nome da categoria não pode estar vazio.');
      return;
    }
    setError('');

    try {
      await api.post('/categorias/', { nome });
      console.log("Categoria salva com sucesso!");
      if (onCategoryAdded) {
        onCategoryAdded(); // Avisa a página pai que a categoria foi adicionada
      }
    } catch (err) {
      console.error("Erro ao salvar categoria:", err.response?.data);
      // O backend já impede nomes duplicados, então podemos mostrar esse erro.
      if (err.response?.data?.nome) {
        setError(err.response.data.nome[0]);
      } else {
        setError("Ocorreu um erro ao salvar a categoria.");
      }
    }
  };

  return (
    <form className="add-category-form" onSubmit={handleSave}>
      <div className="form-group">
        <label htmlFor="categoryName">Nome da categoria:</label>
        <input 
          type="text" 
          id="categoryName"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        {error && <p className="error-message">{error}</p>}
      </div>
      <div className="form-actions">
        <Button type="submit" variant="danger">Salvar</Button>
        <Button type="button" variant="secondary-outline" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
};



export default AddCategoryForm;