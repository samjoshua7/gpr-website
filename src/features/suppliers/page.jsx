import React from 'react';
import { Box, Typography } from '@mui/material';

export const SuppliersPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Suppliers
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage inventory suppliers, contact details, and supplier balances.
      </Typography>
    </Box>
  );
};
export default SuppliersPage;
