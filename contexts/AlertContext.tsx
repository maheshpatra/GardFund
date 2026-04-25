import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomAlert from '../components/CustomAlert';

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({} as AlertContextType);

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (newOptions: AlertOptions) => {
    setOptions(newOptions);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  const handleConfirm = () => {
    if (options.onConfirm) {
      options.onConfirm();
    }
    hideAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        title={options.title}
        message={options.message}
        type={options.type}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        onClose={hideAlert}
        onConfirm={handleConfirm}
      />
    </AlertContext.Provider>
  );
};
