import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import GprErrorDialog from '../../components/feedback/GprErrorDialog';

const ErrorContext = createContext(null);

export const ErrorProvider = ({ children }) => {
  const [errorState, setErrorState] = useState({
    open: false,
    error: null,
    title: 'An error occurred',
    actionContext: '',
    payload: null,
  });

  const showError = useCallback((error, contextOptions = {}) => {
    console.error('GPR-ERROR Triggered:', error, contextOptions);
    const title = contextOptions.title || 'An error occurred';
    const actionContext = contextOptions.actionContext || contextOptions.action || '';
    const payload = contextOptions.payload || null;

    setErrorState({
      open: true,
      error,
      title,
      actionContext,
      payload,
    });
  }, []);

  const closeError = useCallback(() => {
    setErrorState((prev) => ({ ...prev, open: false }));
  }, []);

  // Expose global showGprError on window object for convenience across all API modules
  useEffect(() => {
    window.showGprError = showError;
    return () => {
      delete window.showGprError;
    };
  }, [showError]);

  return (
    <ErrorContext.Provider value={{ showError, closeError }}>
      {children}
      <GprErrorDialog
        open={errorState.open}
        onClose={closeError}
        error={errorState.error}
        title={errorState.title}
        actionContext={errorState.actionContext}
        payload={errorState.payload}
      />
    </ErrorContext.Provider>
  );
};

export const useGprError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      showError: (err, opts) => {
        if (typeof window !== 'undefined' && window.showGprError) {
          window.showGprError(err, opts);
        } else {
          console.error('GPR-ERROR:', err, opts);
          alert(`GPR-ERROR:\n${err?.message || err}`);
        }
      },
      closeError: () => {},
    };
  }
  return context;
};

export default ErrorProvider;
