import React from 'react';
import { Box, Typography } from '@mui/material';

export const SuppliersPage = () => {
  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Suppliers
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Manage inventory suppliers, contact details, and supplier balances.
      </Typography>
    </Box>
  );
};
export default SuppliersPage;
