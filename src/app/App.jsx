import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { AuthProvider } from './providers/AuthProvider';
import { ErrorProvider } from './providers/ErrorProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { CartProvider } from '../features/store/context/CartContext';
import { router } from '../routes';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ErrorProvider>
          <NotificationProvider>
            <CartProvider>
              <RouterProvider router={router} />
            </CartProvider>
          </NotificationProvider>
        </ErrorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
