import React from 'react';
import { Box, Typography } from '@mui/material';

export const PurchaseBillsPage = () => {
  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Purchase Bills
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Record purchases of paper, ink, and plate materials, and track bill payment status.
      </Typography>
    </Box>
  );
};
export default PurchaseBillsPage;
