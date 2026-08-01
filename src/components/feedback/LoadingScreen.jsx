import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const LoadingScreen = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          boxShadow: '0 0 20px rgba(26, 35, 126, 0.5)',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
          P
        </Typography>
      </Box>
      <CircularProgress size={40} thickness={4} sx={{ color: 'secondary.main', mb: 2 }} />
      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '1px' }}>
        LOADING G.P.R Offset Printers, Tirunelveli...
      </Typography>
    </Box>
  );
};
export default LoadingScreen;
