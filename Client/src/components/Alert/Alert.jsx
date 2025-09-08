import './Alert.css';
import React from 'react';

const Alert = ({ messageType, message }) => {
  const messageTypeStyling = {
    success: { icon: 'check_circle', className: 'notification--success' },
    error: { icon: 'cancel', className: 'notification--failure' },
    warning: { icon: 'warning', className: 'notification--warning' },
    info: { icon: 'info', className: 'notification--info' },
  };

  const { icon, className } = messageTypeStyling[messageType] || {};

  return (
    <div className={`alert-container ${className}`}>
      <div className='notification-content'>
        <span className="material-symbols-outlined">{icon}</span>
        <p>{message}</p>
      </div>
      <div className={`notification-progress ${className}`}></div>
    </div>
  );
};

export default Alert;