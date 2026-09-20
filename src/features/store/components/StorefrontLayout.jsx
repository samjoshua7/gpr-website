import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { StoreHeader } from './StoreHeader';

export const StorefrontLayout = () => {
  const location = useLocation();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StoreHeader />
      <Box
        key={location.pathname}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          '& > *': { minHeight: 'calc(100vh - 72px)' },
          animation: 'storeRouteFadeIn 180ms ease-out',
          '@keyframes storeRouteFadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
