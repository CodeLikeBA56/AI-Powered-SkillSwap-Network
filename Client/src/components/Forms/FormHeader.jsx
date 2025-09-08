import './FormHeader.css';
import React from 'react';

const FormHeader = ({ header, closeModal, handleSubmit }) => {
  return (
    <header className='form-header'>
        <button className="modal-close-btn" onClick={() => {
            document.querySelector('.modal-overlay').classList.remove('show');
            setTimeout(() => closeModal(), 300);
        }}>
            <span className='material-symbols-outlined'>close</span>
        </button>
        <h2 className="form-title">{header}</h2>
        <button type='button' onClick={handleSubmit}>Create</button>
    </header>
  );
};

export default FormHeader;