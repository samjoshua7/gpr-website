import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { AuthProvider } from './providers/AuthProvider';
import { ErrorProvider } from './providers/ErrorProvider';
import { router } from '../routes';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ErrorProvider>
          <RouterProvider router={router} />
        </ErrorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
