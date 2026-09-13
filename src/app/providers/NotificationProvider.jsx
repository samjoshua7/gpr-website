import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AppSnackbar from '../../components/feedback/AppSnackbar';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toastState, setToastState] = useState({
    open: false,
    message: '',
    severity: undefined,
    showInFolder: false,
    subfolder: '',
    filePath: '',
    fileBlob: null,
    autoHideDuration: 5000,
  });

  const showToast = useCallback(({
    message,
    severity,
    showInFolder = false,
    subfolder = '',
    filePath = '',
    fileBlob = null,
    autoHideDuration = 5000,
  }) => {
    setToastState({
      open: true,
      message,
      severity,
      showInFolder,
      subfolder,
      filePath,
      fileBlob,
      autoHideDuration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, open: false }));
  }, []);

  // Expose showGprToast globally for convenience
  useEffect(() => {
    window.showGprToast = showToast;
    return () => {
      delete window.showGprToast;
    };
  }, [showToast]);

  return (
    <NotificationContext.Provider value={{ showToast, hideToast }}>
      {children}
      <AppSnackbar
        open={toastState.open}
        onClose={hideToast}
        message={toastState.message}
        severity={toastState.severity}
        showInFolder={toastState.showInFolder}
        subfolder={toastState.subfolder}
        filePath={toastState.filePath}
        fileBlob={toastState.fileBlob}
        autoHideDuration={toastState.autoHideDuration}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Fallback if accessed outside provider
    return {
      showToast: (opts) => console.log('Toast (outside provider):', opts),
      hideToast: () => {},
    };
  }
  return context;
};

export default NotificationProvider;
