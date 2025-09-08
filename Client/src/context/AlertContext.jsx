import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);
  const [alertTimeout, setAlertTimeout] = useState(null);

  const showAlert = useCallback((type, message) => {
    if (alertTimeout)
      return

    setAlert({ type, message });

    const timeout = setTimeout(() => {
      setAlert(null)
      setAlertTimeout(null)
    }, 4000);
    setAlertTimeout(timeout);
  }, []);

  return (
    <AlertContext.Provider value={{ alert, showAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlertContext = () => useContext(AlertContext);

export default AlertProvider;